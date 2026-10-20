CLUSTER = dev-cluster

up:
	kind create cluster --name $(CLUSTER) --image kindest/node:v1.31.4 --wait 5m --config kind-config.yaml || true
	kubectl wait --for=condition=Ready nodes --all --timeout=120s
	skaffold dev

down:
	kind delete cluster --name $(CLUSTER)