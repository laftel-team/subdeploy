import childProcess from 'child_process'

function gitSwitch(branch: string) {
    childProcess.execSync('git fetch --all')
    childProcess.execSync(`git switch ${branch}`)
}

export default gitSwitch