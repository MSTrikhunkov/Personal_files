#!/usr/bin/env python3
"""Portable checks of actual source functions; not the Nova unit test suite.

Usage: python3 verify_backports.py /path/to/nova-tree
Imports are replaced only to avoid Linux-only runtime dependencies on macOS.
Function/class bodies are compiled unchanged from the supplied source tree.
"""
import ast
import copy
import pathlib
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from unittest import mock

ROOT = pathlib.Path(sys.argv.pop(1)).resolve()


def load_nodes(path, select, namespace):
    source = ROOT / path
    tree = ast.parse(source.read_text(), filename=str(source))
    nodes = select(tree)
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(source), 'exec'),
         namespace)
    return namespace


class FormatError(Exception):
    def __init__(self, **kwargs):
        super().__init__(kwargs)


class BackportTests(unittest.TestCase):
    def setUp(self):
        exceptions = types.SimpleNamespace(InvalidImageFormat=FormatError,
                                           InvalidDiskFormat=FormatError)
        model = load_nodes('nova/virt/image/model.py',
                           lambda t: [n for n in t.body if not isinstance(
                               n, (ast.Import, ast.ImportFrom))],
                           {'exception': exceptions})
        self.model = types.SimpleNamespace(**model)
        self.execute = mock.Mock()
        self.ploop = mock.Mock()
        self.can_resize = mock.Mock(return_value=True)
        self.extendable = mock.Mock(return_value=False)
        self.disk = load_nodes('nova/virt/disk/api.py',
                              lambda t: [n for n in t.body if isinstance(
                                  n, ast.FunctionDef) and n.name == 'extend'],
                              dict(imgmodel=self.model, exception=exceptions,
                                   processutils=types.SimpleNamespace(
                                       execute=self.execute),
                                   can_resize_image=self.can_resize,
                                   is_image_extendable=self.extendable,
                                   CONF=types.SimpleNamespace(
                                       resize_fs_using_block_device=False),
                                   nova=types.SimpleNamespace(privsep=
                                       types.SimpleNamespace(libvirt=
                                           types.SimpleNamespace(
                                               ploop_resize=self.ploop))),
                                   LOG=mock.Mock()))
        self.scheduler = mock.Mock()
        self.create = load_nodes('nova/compute/api.py',
                                 lambda t: [n for c in t.body if isinstance(
                                     c, ast.ClassDef) and c.name == 'API'
                                     for n in c.body if isinstance(
                                         n, ast.FunctionDef)
                                     and n.name == 'create'],
                                 {'scheduler_utils': self.scheduler})['create']

    def check_hints(self, supplied, expected):
        original = copy.deepcopy(supplied)
        api = mock.Mock()
        flavor = object()
        self.create(api, mock.Mock(), flavor, 'image',
                    scheduler_hints=supplied)
        self.scheduler.build_filter_properties.assert_called_once_with(
            expected, None, None, flavor)
        self.assertEqual(original, supplied)
        api._create_instance.assert_called_once()

    def test_internal_hints_list(self):
        self.check_hints({'_nova_check_type': ['rebuild'],
                          '_nova_future': 'x', 'group': 'uuid'},
                         {'group': 'uuid'})

    def test_internal_hints_string(self):
        self.check_hints({'_nova_check_type': 'rebuild'}, {})

    def test_entire_reserved_prefix(self):
        self.check_hints({'_nova': 'x', '_novaAnything': 'y'}, {})

    def test_regular_and_unknown_hints(self):
        hints = {'group': 'uuid', 'same_host': ['uuid'], 'custom': 'value'}
        self.check_hints(hints, hints.copy())

    def test_empty_hints(self):
        self.check_hints({}, {})

    def test_none_hints(self):
        self.check_hints(None, None)

    def check_format(self, fmt):
        image = self.model.LocalFileImage('/unused/test.img', fmt)
        self.disk['extend'](image, 2097152)
        self.execute.assert_called_once_with('qemu-img', 'resize', '-f', fmt,
                                             image.path, 2097152)

    def test_raw_format(self):
        self.check_format('raw')

    def test_qcow2_format(self):
        self.check_format('qcow2')

    def test_ploop_unchanged(self):
        image = self.model.LocalFileImage('/unused/test.img', 'ploop')
        self.disk['extend'](image, 2097152)
        self.ploop.assert_called_once_with(image.path, 2097152)
        self.execute.assert_not_called()

    def test_unsupported_format_rejected_before_execute(self):
        image = self.model.LocalFileImage('/unused/test.img', 'raw')
        image.format = 'vmdk'  # Simulate a future extension of ALL_FORMATS.
        with self.assertRaises(FormatError):
            self.disk['extend'](image, 2097152)
        self.execute.assert_not_called()

    def test_vmdk_already_rejected_by_model(self):
        with self.assertRaises(FormatError):
            self.model.LocalFileImage('/unused/test.img', 'vmdk')

    def test_nonlocal_unchanged(self):
        self.disk['extend'](self.model.Image('raw'), 2097152)
        self.execute.assert_not_called()

    def test_no_growth_unchanged(self):
        self.can_resize.return_value = False
        self.disk['extend'](self.model.LocalFileImage('/unused', 'raw'), 1)
        self.execute.assert_not_called()

    @unittest.skipUnless(shutil.which('qemu-img'), 'qemu-img unavailable')
    def test_real_qemu_raw_with_qcow_header(self):
        # Harmless QCOW2 header without backing files or external data files.
        # A guest-controlled header must not change the intended RAW format.
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'guest.img'
            subprocess.run(['qemu-img', 'create', '-f', 'qcow2', str(path),
                            '1M'], check=True, capture_output=True)
            header = path.read_bytes()[:512]
            self.assertLess(path.stat().st_size, 2097152)
            self.execute.side_effect = lambda *args: subprocess.run(
                [str(x) for x in args], check=True, capture_output=True)
            self.disk['extend'](self.model.LocalFileImage(str(path), 'raw'),
                                2097152)
            self.assertEqual(2097152, path.stat().st_size)
            self.assertEqual(header, path.read_bytes()[:512])


if __name__ == '__main__':
    unittest.main(verbosity=2)
