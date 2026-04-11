# TrackPulse — Deploy Guide

## First-Time Setup

**1. Start the local registry** (once only)
```powershell
docker run -d -p 5000:5000 --restart=always --name local-registry registry:2
```

**2. Build and push the image**
```powershell
docker build --provenance=false -t trackpulse:latest .
docker tag trackpulse:latest localhost:5000/trackpulse:latest
docker push localhost:5000/trackpulse:latest
```

**3. Deploy everything**
```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-postgres-pvc.yaml
kubectl apply -f k8s/02-postgres-deployment.yaml
kubectl apply -f k8s/03-postgres-service.yaml
kubectl apply -f k8s/04-azurite-deployment.yaml
kubectl apply -f k8s/05-azurite-service.yaml
kubectl apply -f k8s/06-app-secrets.yaml
kubectl apply -f k8s/07-app-configmap.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n trackpulse --timeout=60s
kubectl apply -f k8s/10-db-migrate-job.yaml
kubectl wait --for=condition=complete job/db-migrate -n trackpulse --timeout=120s
kubectl apply -f k8s/08-app-deployment.yaml
kubectl apply -f k8s/09-app-service.yaml
```

**4. Start the port-forward** (keep this window open)
```powershell
kubectl port-forward -n trackpulse service/trackpulse-service 3000:80
```

Open **http://localhost:3000**

---

## Every Time You Restart Docker Desktop

Just run the port-forward again:
```powershell
kubectl port-forward -n trackpulse service/trackpulse-service 3000:80
```

---

## After Code Changes

```powershell
docker build --provenance=false -t trackpulse:latest .
docker tag trackpulse:latest localhost:5000/trackpulse:latest
docker push localhost:5000/trackpulse:latest
kubectl rollout restart deployment/trackpulse -n trackpulse
```

---

## Useful Commands

```powershell
kubectl get pods -n trackpulse                          # check status
kubectl logs -n trackpulse -l app=trackpulse -f         # app logs
kubectl describe pod <pod-name> -n trackpulse           # debug a pod
kubectl exec -it -n trackpulse deploy/postgres -- psql -U postgres -d trackpulse  # open DB
kubectl delete namespace trackpulse                     # tear everything down
```
