Units Of Sound server side

all routes require [HTTP Basic auth](http://en.wikipedia.org/wiki/Basic_access_authentication) to access.

invalid username & password combinations will bre responded with HTTP Status Code `401`

#login

```
curl -X GET https://uos-dev.herokuapp.com/login/ -i --basic -u example-user:example-password -H "Accept:application/json"
```

#centers

N.B. the centers route is also aliased as `/center/` this route is depreciated and likely to be removed in future

###retrieve a list of centers

```
curl -X GET https://uos-dev.herokuapp.com/centers/ -i --basic -u example-user:example-password -H "Accept:application/json"
```

###search centers

```
curl -X GET https://uos-dev.herokuapp.com/centers?name=[search expresion] -i --basic -u example-user:example-password -H "Accept:application/json"
```


###retrieve a single of centers

```
curl -X GET https://uos-dev.herokuapp.com/centers/[guid-of-center] -i --basic -u example-user:example-password -H "Accept:application/json"
```
#user

N.B. the users route is also aliased as `/user/` and `/student/` this route is depreciated and likely to be removed in future

###create users

```
curl -X POST https://uos-dev.herokuapp.com/users -i --basic -u example-user:example-password --data '{"username":"", "pw1":""}' -H "Content-Type:application/json" -H "Accept:application/json"
```

###get users

```
curl -X GET https://uos-dev.herokuapp.com/users/[guid-of-user] -i --basic -u example-user:example-password -H "Accept:application/json"
```

###search users

```
curl -X POST https://uos-dev.herokuapp.com/users/find --data '[JSON query]' -i --basic -u tutor:teacher -H "Accept:application/json" -H "Content-Type:application/json"
```

###search users

```
curl -X POST https://uos-dev.herokuapp.com/users/delete --data '[JSON query]' -i --basic -u tutor:teacher -H "Accept:application/json" -H "Content-Type:application/json"
```


#misc

there is one route that currently does not require auth.

`curl https://uos-dev.herokuapp.com/healthcheck`

this should allways return a `200` response