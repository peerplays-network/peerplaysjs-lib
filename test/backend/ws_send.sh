[ -d log_for_test ] || mkdir log_for_test

ID_EPOCH_BASED=$(date '+%s%N')
echo $ID_EPOCH_BASED
# ="'{\"id\": 1, \"method\":\"call\", \"params\":[0,\"get_accounts\",[[\"1.2.0\"]]]}'"


JSON_ID="1"
JSON_METHOD="call"
JSON_PARAMS=[0,"get_accounts",[["1.2.0"]]]

JSON_DATA_TO_SEND=$( jq -n \
                  --arg jid "$JSON_ID" \
                  --arg jmethod "$JSON_METHOD" \
                  --arg jparams "$JSON_PARAMS" \
                  '{id: $jid, method: $jmethod, params: $jparams}' )

echo $JSON_DATA_TO_SEND
wscat -c ws://127.0.0.1:8090 -x  $JSON_DATA_TO_SEND
     
