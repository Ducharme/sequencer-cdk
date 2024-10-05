#!/bin/sh

echo "kubectl get po"
kubectl get po
echo ""

echo "kubectl get ds"
kubectl get ds
echo ""

echo "kubectl get rs"
kubectl get rs
echo ""

echo "kubectl get cm"
kubectl get cm
echo ""

echo "kubectl get secret"
kubectl get secret
echo ""

echo "kubectl get deploy"
kubectl get deploy
echo ""

echo "kubectl get svc"
kubectl get svc
echo ""

echo "kubectl get statefulsets"
kubectl get statefulsets
echo ""

echo "DONE"
