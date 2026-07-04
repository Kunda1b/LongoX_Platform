# Kubernetes Cluster Failure Runbook

## Failure Scenarios
- **Node group failure**: Worker nodes become unhealthy or inaccessible
- **Control plane failure**: API server, scheduler, or controller manager unavailable
- **etcd failure**: Cluster state corruption or loss of quorum
- **Full cluster loss**: Complete region or cloud provider failure

## Prerequisites
- kubectl configured with backup cluster context
- Access to EKS console or AWS CLI
- Backup cluster pre-provisioned and ready
- Velero or similar backup tool installed
- Recent cluster state backup available

## Initial Assessment

### 1. Determine Failure Scope
```bash
# Check node status
kubectl get nodes -o wide

# Check control plane components
kubectl get componentstatuses

# Check cluster events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Check pod distribution
kubectl get pods --all-namespaces -o wide | grep -v Running
```

### 2. Attempt Recovery
```bash
# If control plane is degraded, check etcd cluster health
kubectl exec -n kube-system etcd-0 -- etcdctl endpoint health

# Restart kubelet on unhealthy nodes
kubectl drain <node> --ignore-daemonsets --delete-local-data
kubectl uncordon <node>

# Force delete stuck pods
kubectl delete pod <pod> -n <namespace> --force --grace-period=0
```

## Recovery Steps

### Step 1: Declare Cluster Failure
```bash
# If recovery attempts fail within 5 minutes, declare failure
echo "CLUSTER FAILURE DECLARED: $(date)" | \
  tee /var/log/cluster-failure-$(date +%Y%m%d-%H%M%S).log

# Notify on-call
pagerduty trigger --service "LongoX Kubernetes" --severity critical
```

### Step 2: Switch kubectl Context to Backup Cluster
```bash
kubectl config use-context longox-backup-cluster

# Verify connectivity
kubectl cluster-info
kubectl get nodes
```

### Step 3: Restore Cluster State from Backup
```bash
# List available backups
velero get backups

# Restore latest backup
velero restore create --from-backup longox-cluster-backup-$(date +%Y%m%d) \
  --wait

# Verify restoration
velero restore describe <restore-name>
```

### Step 4: Restore Persistent Volumes
```bash
# Check PV/PVC status
kubectl get pv,pvc --all-namespaces

# If PVs are in Released state, reclaim them
for pv in $(kubectl get pv -o json | jq -r '.items[] | select(.status.phase=="Released") | .metadata.name'); do
  kubectl patch pv $pv -p '{"spec":{"claimRef":null}}'
done

# Recreate PVCs if needed
kubectl get pvc --all-namespaces -o json | \
  jq '.items[] | select(.status.phase=="Lost") | .metadata.name' | \
  xargs -I {} kubectl delete pvc {} --force
```

### Step 5: Restore Database from Backup
```bash
# Cross-region promotion if needed (see database-failover.md)
# Or restore from S3 backup
aws s3 cp s3://longox-backups/db/latest.sql.gz /tmp/db-restore.sql.gz
gunzip /tmp/db-restore.sql.gz
psql $DATABASE_URL < /tmp/db-restore.sql
```

### Step 6: Restore Application Workloads
```bash
# Deploy core infrastructure first
kubectl apply -f infrastructure/helm/longox/crds/
kubectl apply -f infrastructure/helm/longox/namespaces/

# Deploy platform services
helm upgrade --install longox-platform infrastructure/helm/longox \
  --values infrastructure/helm/longox/values-dr.yaml \
  --namespace longox

# Wait for all deployments to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment --all -n longox
```

### Step 7: Restore Ingress Configuration
```bash
# Recreate ingress rules
kubectl apply -f infrastructure/kubernetes/ingress/

# Verify ingress is routing correctly
curl -s https://api.longox.ai/healthz
```

### Step 8: Verify Full Platform Health
```bash
# Run full health check suite
./scripts/health-check.sh --all-services

# Verify data integrity
./scripts/data-integrity-check.sh

# Run synthetic tests
./scripts/synthetic-test.sh --full-suite
```

## PV/PVC Migration Considerations

### If original PVs are inaccessible:
1. Delete stuck PVCs: `kubectl delete pvc <name> --force`
2. Update deployments to use ephemeral storage: `kubectl patch deployment <name> -p '{"spec":{"template":{"spec":{"volumes":[{"emptyDir":{}}]}}}}'`
3. Restore data from S3/backup into new volumes
4. Recreate PVCs with same names but new backing storage

### EBS Volume Recovery:
```bash
# List orphaned EBS volumes
aws ec2 describe-volumes --filters "Name=status,Values=available"

# Create PV from existing EBS volume
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: manual-pv-$(date +%s)
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  awsElasticBlockStore:
    volumeID: vol-xxxxxx
    fsType: ext4
EOF
```

## Estimated RTO: 30 minutes

## Post-Recovery Checklist
- [ ] All pods in Running state
- [ ] Database connectivity verified
- [ ] Ingress routing confirmed
- [ ] Monitoring and alerting operational
- [ ] Backup schedule resumed
- [ ] Failed cluster resources cleaned up to avoid cost leakage

## Related Runbooks
- database-failover.md — Detailed DB failover procedures
- region-failover.md — Cross-region failover
- full-platform-recovery.md — Complete platform recovery
