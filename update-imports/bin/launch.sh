#!/bin/bash

script_dir=`dirname $0`
project_dir=`pwd`

node $script_dir/create-specs-file.js --specsFile=$script_dir/specs.json --projectDir=$project_dir

jscodeshift --specs="$script_dir/specs.json" --ignore-pattern="**/node_modules/**" -t $script_dir/update-imports.js $project_dir