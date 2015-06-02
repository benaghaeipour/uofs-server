Units Of Sound server side

all routes require [HTTP Basic auth](http://en.wikipedia.org/wiki/Basic_access_authentication) to access.

invalid username & password combinations will bre responded with HTTP Status Code `401`

#login

```
curl -X GET https://uos-dev.herokuapp.com/login/ -i --basic -u example-user:example-password
```

#center

N.B. the users route is also aliased as `/centers/` this route is depreciated and likely to be removed in future

###retrieve a list of centers

```
curl -X GET https://uos-dev.herokuapp.com/centers/ -i --basic -u example-user:example-password
```

###search centers

```
curl -X GET https://uos-dev.herokuapp.com/centers?name=[search expresion] -i --basic -u example-user:example-password
```


###retrieve a single of centers

```
curl -X GET https://uos-dev.herokuapp.com/centers/[guid-of-center] -i --basic -u example-user:example-password
```


#misc

there is one route that currently does not require auth.

`curl https://uos-dev.herokuapp.com/healthcheck`

this should allways return a `200` response