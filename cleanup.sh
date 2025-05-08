#!/bin/bash

# Regex pattern for the Stripe API key
PATTERN="sk_test_51RMIDwR8tbgGz3myL8FmNPzLPtChX9ef5y6HAE7FiY85UYmz76fhzNKRSTOkoJjsBT3PD4JTZKZQqrV9phtBxK7a00IU8esQPB"
REPLACEMENT="your_stripe_secret_key_here"

# Function to replace the pattern in a file
cleanup_file() {
  FILE="$1"
  if [ -f "$FILE" ]; then
    sed -i '' "s/$PATTERN/$REPLACEMENT/g" "$FILE"
  fi
}

# Clean up any occurrences of the API key in the files
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/cleanup.sh" -exec grep -l "$PATTERN" {} \; | while read file; do
  echo "Cleaning $file"
  cleanup_file "$file"
done

echo "Completed cleanup" 