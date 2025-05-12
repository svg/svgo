#!/usr/bin/env bash


# Description:
#   Validates all SVG files in a specified directory against a given SVGO validation rule
#   Reports passes and failures with concurrent processing for performance

source "$(dirname "$0")/../node_modules/@mservicestech/scripts/utils.sh" 2>/dev/null || true

 
function usage() {
  cat << END
Usage:
    ./validate_rule_on_directory.sh --rule=<rule-name> --dir=<directory-path> [--help] [--verbose] [--fail-fast] [--jobs=<number>]

Where:
    --rule       - Name of the validation rule to run (e.g., ensureSingleRootG)
    --dir        - Directory containing SVG files to validate
    --verbose    - Show detailed validation information
    --fail-fast  - Stop on first validation failure
    --jobs       - Number of concurrent validation jobs (default: 4)
    --help       - Print usage information and exit

Description:
    Validates all SVG files in the specified directory against a given SVGO validation rule.
    Reports which files pass and which fail the validation.
    Uses concurrent processing for faster validation of large directories.

Examples:
    ./validate_rule_on_directory.sh --rule=ensureSingleRootG --dir=./my-svgs
    ./validate_rule_on_directory.sh --rule=ensureSingleRootG --dir=./my-svgs --verbose --jobs=8
END
}


function process_file() {
  local svg_file="$1"
  local rule="$2"
  local validation_script="$3"
  local verbose="$4"
  local temp_dir="$5"
  local file_id=$(basename "$svg_file" | sed 's/[^a-zA-Z0-9]/_/g')
  
  if [ "$verbose" = "true" ]; then
    logger_info "Processing: $svg_file" 
  fi
  
  if output=$(node "$validation_script" "$svg_file" "$rule" 2>&1); then
    logger_log "$output"
    echo "PASS" > "$temp_dir/result_${file_id}"
  else
    logger_log "$output"

    if [[ $output == *"FAIL:"* ]]; then
      echo "FAIL:$(basename "$svg_file")" > "$temp_dir/result_${file_id}"
    else
      logger_error "Error validating $svg_file: $output"
      echo "ERROR:$(basename "$svg_file")" > "$temp_dir/result_${file_id}"
    fi
  fi
}

function main() {
  parse_arguments "$@"

  if [ "${PROCESS_ARGUMENTS['--help']}" ]; then
    usage
    exit 0
  fi

  local rule="${PROCESS_ARGUMENTS['--rule']}"
  local directory="${PROCESS_ARGUMENTS['--dir']}"
  local verbose="${PROCESS_ARGUMENTS['--verbose']}"
  local fail_fast="${PROCESS_ARGUMENTS['--fail-fast']}"
  local jobs="${PROCESS_ARGUMENTS['--jobs']:-4}"   

  if [ -z "$rule" ]; then
    logger_error "Missing required argument: --rule"
    usage
    exit 1
  fi

  if [ -z "$directory" ]; then
    logger_error "Missing required argument: --dir"
    usage
    exit 1
  fi

  if [ ! -d "$directory" ]; then
    logger_error "Directory does not exist: $directory"
    exit 1
  fi

  local script_dir="$(dirname "$0")"
  local validation_script="${script_dir}/runValidation.js"

  if [ ! -f "$validation_script" ]; then
    logger_error "Validation script not found: $validation_script"
    exit 1
  fi

  local temp_dir=$(mktemp -d)
  trap 'rm -rf "$temp_dir"' EXIT

  local total_files=0
  
  logger_info "Validating SVG files in $directory using rule: $rule (with $jobs concurrent jobs)"
  
  mapfile -t svg_files < <(find "$directory" -type f -name "*.svg" | sort)
  total_files=${#svg_files[@]}
  
  if [ $total_files -eq 0 ]; then
    logger_warn "No SVG files found in $directory"
    exit 0
  fi
  
  local active_jobs=0
  for svg_file in "${svg_files[@]}"; do
    if [ "$fail_fast" = "true" ] && [ -n "$(find "$temp_dir" -name "result_*" -exec grep -l "^FAIL:" {} \;)" ]; then
      logger_warn "Stopping due to --fail-fast option"
      break
    fi
    
    process_file "$svg_file" "$rule" "$validation_script" "$verbose" "$temp_dir" &
    
    ((active_jobs++))
    
    if [ $active_jobs -ge $jobs ]; then
      wait -n
      ((active_jobs--))
    fi
  done
  
  wait
  
  local passed_files=$(find "$temp_dir" -name "result_*" -exec grep -l "^PASS" {} \; | wc -l)
  local failed_files=$(find "$temp_dir" -name "result_*" -exec grep -l "^FAIL:" {} \; | wc -l)
  local error_files=$(find "$temp_dir" -name "result_*" -exec grep -l "^ERROR:" {} \; | wc -l)
  
  local failed_file_list=""
  while IFS= read -r result_file; do
    if [ -f "$result_file" ]; then
      local content=$(cat "$result_file")
      if [[ "$content" == FAIL:* ]]; then
        local filename="${content#FAIL:}"
        failed_file_list="$failed_file_list\n$filename"
      fi
    fi
  done < <(find "$temp_dir" -name "result_*")

 
  logger_info "Validation Summary:"
  logger_info "  Total files: $total_files"
  logger_info "  Passed: $passed_files"
  if [ $failed_files -gt 0 ]; then
    logger_error "  Failed: $failed_files"
    logger_error "  Failed files:$failed_file_list"
  else
    logger_info "  Failed: 0"
  fi
  if [ $error_files -gt 0 ]; then
    logger_error "  Errors: $error_files"
  fi

  if [ $failed_files -gt 0 ] || [ $error_files -gt 0 ]; then
    return 1
  fi
  
  logger_info "All files passed validation!"
  return 0
}

main "$@" 