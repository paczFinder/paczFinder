CLUSTER = dev-cluster

up:
	kind create cluster --name $(CLUSTER) --config kind-config.yaml || true
	skaffold dev

down:
	kind delete cluster --name $(CLUSTER)