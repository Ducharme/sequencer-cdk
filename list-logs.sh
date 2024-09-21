#!/bin/sh

# List all log groups
log_groups=$(aws logs describe-log-groups --query 'logGroups[?starts_with(logGroupName, `/aws/lambda/RedisStack-SetPasswordFunction`)].logGroupName' --output text)

# Loop through each log group
for log_group in $log_groups
do
    echo "Searching in log group: $log_group"
    aws logs filter-log-events --log-group-name "$log_group" --filter-pattern "\"secretData.SecretString\"" --start-time $(date -u -d '4 hours ago' +%s000) --end-time $(date +%s000)
done

