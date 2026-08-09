FROM rust:bookworm AS builder
WORKDIR /app/apps/api
COPY apps/api/Cargo.toml apps/api/Cargo.lock ./
COPY apps/api/src ./src
COPY apps/api/migrations ./migrations
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/apps/api/target/release/embedded_labs_api /usr/local/bin/embedded_labs_api
COPY apps/api/migrations /app/migrations
ENV RUST_LOG=info
EXPOSE 8080
CMD ["embedded_labs_api"]
