#! /bin/bash

SOFT_DIR=`readlink -f ./soft`
ETC_DIR=`readlink -f ./etc`
LIB_DIR=`readlink -f ./lib`
LOG_DIR=`readlink -f ./log`

NEO4J_DIR='neo4j'
NEO4J_PORT='7474'
DERBY_DIR='db-derby'
DERBY_PORT='1527'
export DERBY_HOME=$SOFT_DIR/$DERBY_DIR
PROTOC_DIR='protobuf'
MONGO_DIR='mongo-mock'
MONGO_PORT='27017'
COUCH_DIR='CouchbaseMock'
COUCH_BUCKET=regicb
COUCH_HTTP_PORT=8091

run_nohup() {
  local log_file="$LOG_DIR/nohup_${1}_`date +%y%m%d`.out"
  shift
  echo "### Running : $@ > $log_file"
  nohup $@ > $log_file &
}

run_cmd() {
  echo "### Running : $@"
  $@
}

run_or_die() {
  echo "### Running : $@"
  $@
  if [[ $? != 0 ]]; then
    echo "[ERROR] Failed : $@"
    exit 1
  fi
}

test_or_die() {
  $@
  if [[ $? != 0 ]]; then
    echo "[ERROR] Failed : $@"
    exit 1
  fi
}

build_classpath() {
  local all_jars=`echo $LIB_DIR/*.jar | sed 's/ /:/g'`
  export PROJECT_CLASSPATH=$LIB_DIR:$all_jars
  #echo "PROJECT_CLASSPATH = $LIB_DIR:$all_jars"
}

mkdir -p $SOFT_DIR $LIB_DIR $LOG_DIR
test_or_die test -d $SOFT_DIR -a -d $LIB_DIR -a -d $LOG_DIR
test_or_die test -d $JAVA_HOME
test_or_die which mvn
test_or_die which libtool
test_or_die which curl
test_or_die which wget
test_or_die which netcat
test_or_die which rlwrap

