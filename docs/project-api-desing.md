# Introduction

This file is maded for explain how works the api service on embedded labs and whic REST principles we apply.

Task to make on API:

1. update lifespan. [ ]
2. Define a .env file. [ ]
3. Read env vars security. [ ]
4. Clear separate of responsabilities
5. Migrate api to src dir
6. Init alembic and pytest

The first version of backend had made for Ai assitency. So its wrong about a long of things. We have to solve that.

The ORM is "sqlalchmy"but we'll migrate to "sqlmodel".

We have to migrate the previous architecture to new architeture into "/src".

Its divided on 3 main directories - divided by responsabilities.
Into every directory has the some of the folowing files:

1. router.py -> is a core of each module with all endpoints
2. schemas.py -> for sql models
3. models.py -> for db models
4. service.py -> module specific busnisses logic
5. dependencies.py -> router dependencies
6. constants.py -> module specific constants and error codes
7. config.py -> things like .env vars
8. utils.py -> non-business logic  functions. e.g. response normalization.
9. exceptions.py -> Module specific esceptions, e.g. PostNotFound.


