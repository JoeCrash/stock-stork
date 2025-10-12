#!/bin/bash
# Check if Inngest signing key is configured in environment or client setup

echo "Checking for INNGEST_SIGNING_KEY in environment..."
if [ -z "$INNGEST_SIGNING_KEY" ]; then
    echo "⚠️  INNGEST_SIGNING_KEY not found in environment"
else
    echo "✓ INNGEST_SIGNING_KEY is set"
fi

echo ""
echo "Checking client configuration for signing key..."S
rg -n "signingKey|INNGEST_SIGNING_KEY" ../lib/inngest/client.ts