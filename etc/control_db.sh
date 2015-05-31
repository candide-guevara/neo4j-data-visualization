#! /bin/bash

USAGE="
USAGE : control_db [OPTIONS]
Controls the different data stores (start/stop)
Options:
  -n/N    Starts/Stops neo4j at $NEO4J_PORT
  -m/M    Starts/Stops mongo mock at $MONGO_PORT
  -c/C    Starts/Stops couchbase mock at $COUCH_HTTP_PORT
  -d/D    Starts/Stops derby at $DERBY_PORT
  -s      Open derby sql console
"

source `dirname $0`/setup.sh

stop_derby() {
  run_cmd java -jar $DERBY_HOME/lib/derbyrun.jar server shutdown
}

start_derby() {
  #java -jar $DERBY_HOME/lib/derbyrun.jar sysinfo
  stop_derby
  run_nohup derby java -jar $DERBY_HOME/lib/derbyrun.jar server start
  sleep 2
  run_or_die netcat -z localhost $DERBY_PORT
}

derby_sql() {
  rlwrap --prompt-colour=red -S 'derby> ' java -jar $DERBY_HOME/lib/derbyrun.jar ij
}

stop_neo4j() {
  pushd $NEO4J_DIR/bin
  ./neo4j stop
  popd
}

start_neo4j() {
  stop_neo4j
  pushd $NEO4J_DIR/bin
  run_nohup neo4j ./neo4j start
  sleep 3
  run_or_die curl localhost:$NEO4J_PORT
  popd
}

stop_couchbase_mock() {
  pkill -f 'java -jar CouchbaseMock*'
  sleep 1
  pkill -9 -f 'java -jar CouchbaseMock*'
}

start_couchbase_mock() {
  stop_couchbase_mock && sleep 1
  pushd $COUCH_DIR

  mock_jar=( target/CouchbaseMock-*.jar )
  cb_command=( java -jar ${mock_jar[0]}
    --host "0.0.0.0" --port $COUCH_HTTP_PORT
    --buckets $COUCH_BUCKET::couchbase
    --nodes 4 --vbuckets 16
  )
  run_nohup couchbase ${cb_command[@]} 
  sleep 1

  run_or_die curl localhost:$COUCH_HTTP_PORT/pools
  popd
}

stop_mongo_mock() {
  pkill -f 'java -cp mongo-mock'
  sleep 1
  pkill -9 -f 'java -cp mongo-mock'
}

start_mongo_mock() {
  stop_mongo_mock
  build_classpath
  pushd $MONGO_DIR/target
  local main_jar=( mongo-mock-*.jar )
  run_nohup mongodb java -cp ${main_jar[0]}:$PROJECT_CLASSPATH candide.guevara.App
  sleep 2
  run_or_die netcat -z localhost $MONGO_PORT
  popd
}

########################### MAIN ##################################

pushd $SOFT_DIR
while getopts "nNcCmMdDsh" opt; do
  case $opt in
    n) start_neo4j ;;
    N) stop_neo4j ;;
    m) start_mongo_mock ;;
    M) stop_mongo_mock ;;
    c) start_couchbase_mock ;;
    C) stop_couchbase_mock ;;
    d) start_derby ;;
    D) stop_derby ;;
    s) derby_sql ;;
    *) echo "$USAGE" ; exit 1 ;;
  esac
done
popd

