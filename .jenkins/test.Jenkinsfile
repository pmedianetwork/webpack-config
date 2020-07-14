pipeline {
    libraries { lib 'adverity-shared-library@2.10.0' }
    agent { label 'PRJob' }
    environment {
        NODE_VERSION = getNodeVersion()
    }
    stages {
        stage('Test') {
            steps {
                nvm(env.NODE_VERSION) {
                    sh 'npm install && npm run test'
                }
            }
        }
    }
}
