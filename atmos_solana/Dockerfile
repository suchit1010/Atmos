FROM rust:1.85.1-bookworm AS builder

ARG ANCHOR_VERSION=0.31.0
ARG SOLANA_VERSION=2.3.0

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    clang \
    cmake \
    curl \
    git \
    libssl-dev \
    pkg-config \
    python3 \
    wget \
    xz-utils \
  && rm -rf /var/lib/apt/lists/*

RUN cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_VERSION} anchor-cli --locked --force

RUN sh -c "curl -sSfL https://release.solana.com/v${SOLANA_VERSION}/install | sh -s - v${SOLANA_VERSION}"

WORKDIR /workspace
COPY . .

CMD ["anchor", "build"]
