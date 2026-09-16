#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SOURCE=${1:-"$ROOT/fluentd-1.16.2"}
export GEM_HOME="$ROOT/.test-gems"
export GEM_PATH="$GEM_HOME:/Library/Ruby/Gems/2.6.0"
cd "$SOURCE"
exec ruby -Ilib -Itest -rfluent/version -e 'ARGV.each { |f| require File.expand_path(f) }' \
  test/plugin/test_decompression_limit.rb \
  test/plugin/test_extractor.rb \
  test/plugin/test_compressable.rb \
  test/test_event.rb \
  test/test_event_decompression_limit.rb \
  test/plugin/test_in_http.rb \
  test/plugin/test_in_forward.rb \
  test/plugin/test_buf_memory.rb \
  test/plugin/test_buf_file.rb \
  test/plugin/test_buf_file_single.rb \
  test/plugin/test_buffer.rb \
  test/plugin/test_buffer_memory_chunk.rb \
  test/plugin/test_buffer_file_chunk.rb \
  test/plugin/test_buffer_file_single_chunk.rb \
  test/plugin/test_memory_chunk_decompression_limit.rb \
  test/plugin/test_in_monitor_agent.rb \
  test/plugin/test_monitor_agent_security.rb
