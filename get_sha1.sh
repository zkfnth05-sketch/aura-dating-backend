#!/bin/bash

# 비밀번호를 파일에서 읽어옵니다.
KEYSTORE_PASSWORD=$(cat password.txt)

# keytool 명령어를 실행합니다.
keytool -list -v -keystore /home/user/studio/android.keystore -alias android -storepass "$KEYSTORE_PASSWORD"
