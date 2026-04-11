#!/usr/bin/env python3
import re

# Read the file
with open('client/src/pages/ExpertPortal.tsx', 'r') as f:
    lines = f.readlines()

# Find the line numbers for key sections
parse_linkedin_start = None
parse_linkedin_end = None
profile_form_start = None

for i, line in enumerate(lines):
    if 'Manual LinkedIn URL Parsing' in line:
        parse_linkedin_start = i
    if parse_linkedin_start is not None and parse_linkedin_end is None and '</div>' in line and i > parse_linkedin_start + 20:
        parse_linkedin_end = i
    if 'Profile Form' in line and '{/*' in line:
        profile_form_start = i

if parse_linkedin_start and parse_linkedin_end and profile_form_start:
    # Extract Parse LinkedIn section
    parse_section = lines[parse_linkedin_start:parse_linkedin_end + 1]
    
    # Remove it from original location
    new_lines = lines[:parse_linkedin_start] + lines[parse_linkedin_end + 1:]
    
    # Find new profile form start (adjusted after removal)
    adjustment = parse_linkedin_end - parse_linkedin_start + 1
    new_profile_form_start = profile_form_start - adjustment
    
    # Insert before Profile Form
    final_lines = new_lines[:new_profile_form_start] + parse_section + ['\n'] + new_lines[new_profile_form_start:]
    
    with open('client/src/pages/ExpertPortal.tsx', 'w') as f:
        f.writelines(final_lines)
    
    print("✅ Parse LinkedIn section moved to top")
else:
    print(f"❌ Could not find sections: parse_start={parse_linkedin_start}, parse_end={parse_linkedin_end}, form_start={profile_form_start}")
