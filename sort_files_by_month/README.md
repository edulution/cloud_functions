# How to use
- Create Google Cloud Function with HTTP trigger
- Call function using curl 
```{bash}
curl -X POST \
  <function url> \
  -H 'Content-Type: application/json' \
  -d '{"bucket":"<target bucket name>"}'
```

# Local development and testing
- Install functions framework
```{bash}
pip install functions-framework
```
- Authorise Google app library
```{bash}
gcloud auth application-default login
```
- Run function locally. The function will run on port 8080 unless --port is specified
```{bash}
functions-framework --target=sort_files_by_month --debug
```
- Send request to function
```{bash}
curl -X POST \
	http://localhost:8080 \
	-H "Content-Type: application/json" \
	-d '{"bucket": "<target bucket name>"}
```