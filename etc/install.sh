#! /bin/bash
# Partially automated install script

USAGE="
USAGE : install.sh [OPTIONS]
Install all the soft needed to use the project. For more information please check the README file.
Options:
  null  If called without options, perform some basic dependency checks and exit
  -a    Install all packages
"

source `dirname $0`/setup.sh

NEO4J_URL='http://neo4j.com/artifact.php?name=neo4j-community-2.2.2-unix.tar.gz'
PROTOC_URL='https://github.com/google/protobuf/archive/v2.6.1.zip'
DERBY_URL='http://www.eu.apache.org/dist/db/derby/db-derby-10.11.1.1/db-derby-10.11.1.1-lib.tar.gz'

NEO4J_TAR='neo4j.tar.gz'
PROTOC_ZIP='protobuf.zip'
DERBY_TAR='derby.tar.gz'

MONGO_DRV_URL='https://github.com/mongodb/mongo-java-driver/archive/r2.13.2.zip'
MONGO_DRV_ZIP='mongo-java-driver.zip'
MONGO_DRV_JAR='mongo-java-driver.jar'
MONGO_DRV_DOC_JAR='mongo-java-driver-javadoc.jar'

COUCH_GITHUB='https://github.com/couchbase/CouchbaseMock.git'

clean_all() {
  echo "[WARNING] Cleaning everything !!"
  run_cmd rm -rf $SOFT_DIR $LIB_DIR $LOG_DIR
  mkdir -p $SOFT_DIR $LIB_DIR $LOG_DIR
}

pull_all_deps() {
  pushd $LIB_DIR
  cp $ETC_DIR/project_deps.xml pom.xml
  run_or_die mvn dependency:copy-dependencies -DoutputDirectory=`pwd`
  run_cmd mvn dependency:copy-dependencies -DoutputDirectory=`pwd` -Dclassifier=javadoc -DexcludeTransitive=true
  popd
}

neo4j() {
  #[[ -d $NEO4J_DIR ]] && rm -rf $NEO4J_DIR
  [[ -d $NEO4J_DIR ]] && return

  run_or_die wget -q -O $NEO4J_TAR $NEO4J_URL
  mkdir $NEO4J_DIR
  run_or_die tar zxf $NEO4J_TAR -C $NEO4J_DIR --strip-components=1
	rm $NEO4J_TAR
}

protobuf() {
  #[[ -d $PROTOC_DIR ]] && rm -rf $PROTOC_DIR && rm protobuf-*
  [[ -d $PROTOC_DIR ]] && return

  run_or_die wget -q -O $PROTOC_ZIP $PROTOC_URL
  unzip -q $PROTOC_ZIP
  mv protobuf-* $PROTOC_DIR
	rm $PROTOC_ZIP
  protobuf_install
  protobuf_compile
}

protobuf_install() {
  pushd $PROTOC_DIR
  run_or_die ./autogen.sh
  run_or_die ./configure --quiet --prefix=`pwd`
  run_or_die make --quiet
  run_or_die make --quiet install
  popd
}

protobuf_compile() {
  pushd $PROTOC_DIR
  local proto_path=proto_buf_definition
  [[ -e $proto_path ]] && rm -rf $proto_path

  run_or_die tar xf $ETC_DIR/${proto_path}.tar.gz -C .
  run_or_die bin/protoc --proto_path=$proto_path --java_out=$proto_path $proto_path/*

  pushd $proto_path
  rm *.proto
  for package in *; do
    [[ -e $LIB_DIR/$package ]] && rm -rf $LIB_DIR/$package
    mv $package $LIB_DIR
  done
  popd
  popd
}

derby() {
	#[[ -d $DERBY_DIR ]] && rm -rf $DERBY_DIR
  [[ -d $DERBY_DIR ]] && return

	run_or_die wget -q -O $DERBY_TAR $DERBY_URL
	mkdir $DERBY_DIR
	run_or_die tar zxf $DERBY_TAR -C $DERBY_DIR --strip-components=1
	rm $DERBY_TAR
}

couchbase() {
  #[[ -d $COUCH_DIR ]] && rm -rf $COUCH_DIR
  [[ -d $COUCH_DIR ]] && return

  run_or_die git clone $COUCH_GITHUB
  pushd $COUCH_DIR
  run_or_die mvn --quiet package -DskipTests
  popd
}

mongodb() {
  #[[ -d $MONGO_DIR ]] && rm -rf $MONGO_DIR
  [[ -d $MONGO_DIR ]] && return
  run_or_die tar zxf $ETC_DIR/mongo-mock.tar.gz -C $SOFT_DIR
  
  pushd $MONGO_DIR
  mvn --quiet package -DskipTests
  popd
}

install_all() {
  #clean_all
  pushd $SOFT_DIR
  neo4j
	derby
  protobuf
  mongodb
  couchbase
  pull_all_deps
  popd
}

########################### MAIN ##################################

while getopts "ah" opt; do
  case $opt in
    a) install_all ;;
    *) echo "$USAGE" ; exit 1 ;;
  esac
done

