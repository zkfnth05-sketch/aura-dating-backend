#!/bin/bash

# 같은 폴더에 있는 비밀번호 파일을 읽어옵니다.
KEYSTORE_PASSWORD=$(cat password.txt)

# keytool 명령어를 실행합니다.
# keystore 파일의 경로는 상위 폴더에 있으므로 ../android.keystore 로 지정합니다.
keytool -list -v -keystore ../android.keystore -alias android -storepass "$KEYSTORE_PASSWORD"
