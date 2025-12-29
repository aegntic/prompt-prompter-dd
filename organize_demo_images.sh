#!/bin/bash
# Script to organize downloaded Gemini images for Prompt Prompter demo

# Create demo stills directory
mkdir -p /home/ae/AE/04_Hackathon/Datadog-YPFP/demo_stills

# Find all Gemini generated images from today and list them
echo "=== Finding recent Gemini downloads ==="
find ~/Downloads -type f \( -name "Gemini_Generated_Image*.png" -o -name "Gemini_Generated_Image*.jpg" -o -name "*.mp4" \) -mmin -60 | sort

echo ""
echo "=== Instructions for Manual Organization ==="
echo "Please review your Downloads folder and manually organize the 12 generated images:"
echo ""
echo "Expected images (in generation order):"
echo "  1. Title Card - Prompt Prompter"
echo "  2. Ship It Button"  
echo "  3. Curiosity Arc (3-panel character consistency)"
echo "  4. 2 Billion Tokens Display"
echo "  5. Endless Iteration Loop"
echo "  6. Purple Enough Meter"
echo "  7. Quiet Part Card"
echo "  8. Distributed Tracing Map"
echo "  9. Self-Healing Infrastructure"
echo " 10. Solo Builder Beat"
echo " 11. Human-AI Collaboration"
echo " 12. End Card"
echo ""
echo "Target directory: /home/ae/AE/04_Hackathon/Datadog-YPFP/demo_stills/"
echo ""
echo "Suggested naming convention:"
echo "  01_title_card.png"
echo "  02_ship_it_button.png"
echo "  03_curiosity_arc.png"
echo "  04_two_billion_tokens.png"
echo "  05_endless_iteration.png"
echo "  06_purple_meter.png"
echo "  07_quiet_card.png"
echo "  08_distributed_tracing.png"
echo "  09_self_healing.png"
echo "  10_solo_builder.png"
echo "  11_human_ai_collab.png"
echo "  12_end_card.png"
