Bornhack Metrics Service


# For consumers
_(eventually)_ Explore the data over at `https://metrics.bornhack.dk/graphiql` 

_(eventually)_ POST graphql queries to `https://metrics.bornhack.dk/graphql`

# For Bornhack teams
_(eventually)_ You'll get a secret from the metrics team, you've to POST your data for metrics as follows:

## cURL example
```shell
curl 'metrics.bornhack.dk/submit'\
  -H 'x-bornhack-metrics-teamsecret: verysecretthingfrommetrics'\
  -H 'content-type: application/json'\
  -H 'accept: application/json'\
  --data-binary '{"collection":"testcollection","documents":[{"id":"uniqueID","metric":"memes per minute","value":"9001"},{"id":"uniquerID","metric":"darkness","value":"1"}]}'
```

## axios example
```js
axios({
    method: "post",
    url: "metrics.bornhack.dk/submit",
    headers: {
      "x-bornhack-metrics-teamsecret": "verysecretthingfrommetrics",
      "content-type": "application/json",
    },
    data: {
      documents: [{"id":"uniqueID","metric":"memes per minute","value":"9001"},{"id":"uniquerID","metric":"darkness","value":"1"}],
      collection: "testcollection",
    },
  });
```

Where `collection` is the MongoDB collection name you want to submit your data to, and `documents` an array of JSON objects to be upserted.

These documents must contain a unique `id` property, which will be used to upsert by.(This means that any time you submit with a previously used `id`, the previous document will be replaced.) Any `_id` field will be ignored. 

Other than that there are no specifics as to the structure of the document, and you may nest objects and arrays however you feel like.

However, please try to stick to one structure within each collection.