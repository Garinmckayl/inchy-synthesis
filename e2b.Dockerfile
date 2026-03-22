# You can use most Debian-based base images
# FROM ubuntu:22.04

FROM e2bdev/code-interpreter:latest

RUN pip install yfinance
# Install dependencies and customize sandbox
