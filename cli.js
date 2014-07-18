var Process = require('./main');

function Cli(argv, callback) {
	console.log('Cli');
	var options = require('minimist')(argv.slice(2));
	console.log('options: ', options);
	if (options.o) {
		repoFolder=options.o
	}
	if (options.repo) {
		console.log('repo mode');
		var owner = options.repo.split('/')[0]
		var repo = options.repo.split('/')[1]
		console.log('owner ' + owner + ' repo ' + repo);
		if (options.reponum) {
			//todo implemnet passing repo number so that the prompt will not occur
		}
		if (options.up) {
			console.log('vagrant up');
			Process().perform(options, owner, repo, "vagrant up", callback);
		} else if (options.prov) {
			console.log('vagrant provision');
			Process().perform(options, owner, repo, "vagrant provision", callback);
		} else if (options.echo) {
			console.log('vagrant provision');
			Process().perform(options, owner, repo, "echo 'start vagrant'", callback);
		}else {
			console.log('default command vagrant up');
			Process().perform(options, owner, repo, "vagrant up", callback);
		}
	} else {
		console.log('Usage options \n--g (https or git protocol git is default)\n--o (for differennt output folder than working dir optional)  \n--repo (owner/repo for example pussinboots/vagrant-git mandatory) \n--up (to perform vagrant up default command optional) \n--prov (to perform vagrant provision optional)');
	}
}
module.exports = Cli;