# Data visualization with Neo4j

## Installation
Before you start there are some basic dependencies you need:

* JDK 7
* maven libtool curl wget netcat rlwrap

Just run the script install.sh in etc/. It will install the following components:

* [Protocol Buffer](2) compiler
* [Neo4j](3)
* [Derby db](4)
* [Couchbase mock](5) : no persistence data is stored in memory
* [Mongodb mock](6) : no persistence data is stored in memory
* TODO: Configure auto indexing for keys myid and type in neo4j

If you want to connect to an oracle database you will have to install the jdbc jar in lib/.
You can find it [here](1).

## Getting started
* Install : see above
* TODO: Compile and test using the provided Makefile
* TODO: host d3.js dashboard in simple python web server

## Test data
Now you need some test data to import to the DB, the code comes with very simple examples of anonymised data.
Up to you to go and fetch relevant data ...

[1]: http://www.oracle.com/technetwork/database/enterprise-edition/jdbc-112010-090769.html
[2]: https://github.com/neo4j/neo4j
[3]: https://github.com/google/protobuf
[4]: http://db.apache.org/derby/
[5]: https://github.com/candide-guevara/CouchbaseMock
[6]: https://github.com/bwaldvogel/mongo-java-server

