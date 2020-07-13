pipeline {
    libraries { lib 'adverity-shared-library@2.10.0' }
    agent { label 'PRJob' }
    environment {
        GITHUB_TOKEN = credentials('e8c4eee6-cef3-4fd5-a65c-1050f7ecb0c7')
    }
    stages {
        stage('Validate changeset') {
            steps {
                validateChangesets()
            }
        }
        stage('Release Notes Preview') {
            steps {
                echo generateReleaseNote()
            }
        }
    }
}
