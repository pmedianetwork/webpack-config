def releaseVersion
def releaseNoteBody
def releaseUrl

pipeline {
    libraries { lib 'adverity-shared-library@2.10.0' }
    agent { label 'worker||master' }
    environment {
        GITHUB_TOKEN = credentials('e8c4eee6-cef3-4fd5-a65c-1050f7ecb0c7')
        CURRENT_VERSION = "${readJSON(file: './package.json').version}"
        NODE_VERSION = getNodeVersion()
    }
    stages {
        stage('Changesets') {
            steps {
                script {
                    releaseVersion = computeNextSemanticVersion(currentVersion: env.CURRENT_VERSION)
                    releaseNoteBody = generateReleaseNote()
                }
            }
        }
        stage('Release') {
            steps {
                gitFlowRelease(version: releaseVersion) {
                    nvm(env.NODE_VERSION) {
                        sh "npm version ${releaseVersion} --no-git-tag-version"
                        sh 'npm run build'
                    }
                    cleanChangesets()
                }
                script {
                    releaseUrl = publishRelease(
                            repository: 'pmedianetwork/webpack-config',
                            tag: releaseVersion,
                            body: releaseNoteBody
                    )
                }
            }
        }
    }
    post {
        success {
            slackSend(
                channel: 'dev-frontend, webpack',
                attachments: [
                    [
                        pretext: "Version ${releaseVersion} of webpack-config was released! :tada:",
                        color  : 'good',
                        actions: [
                            [
                                type: 'button',
                                style: 'primary',
                                text: 'Release Notes',
                                url : releaseUrl
                            ],
                        ]
                    ]
                ]
            )
        }
        unsuccessful {
            notifySlack channel: 'webpack'
        }
    }
}
