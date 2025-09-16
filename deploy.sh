#!/bin/bash

# Simple wrapper to run deployment from www root
# This maintains compatibility while keeping scripts organized

cd scripts && ./deploy-all.sh "$@"
