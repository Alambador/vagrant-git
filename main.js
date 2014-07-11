var git  = require('gift');
var yaml = require('yamljs');
var fetchUrl = require("fetch").fetchUrl;
var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;

var repoFolder = "./";
var gitProtocolHttps="https://github.com/"
var gitRaw = "https://raw.githubusercontent.com/"
var gitProtocolGit="git@github.com:"

function getGitProtocol(options) {
	if (options.g)
		if(options.g === "git")
			return gitProtocolGit;
		else if(options.g === "https")
			return gitProtocolHttps;
	return gitProtocolGit;
}

function fetchRepo(options, owner, repo, outputDir, type, callback) {
	if (fs.existsSync(repoFolder +repo)) {
		console.log('git pull on ' + outputDir + '/' + repo + ' ' + type);
		var repository = git(repoFolder + outputDir + '/' + repo);
    	repository.pull('master', function(err, _repo) {
    		if(err) sys.puts(err);
    		if(callback)
    			callback(repo)
	  	})
	} else {
		console.log('git clone ' + getGitProtocol(options) + owner + '/' + repo + ' ' + type + ' into ' + outputDir + '/' + repo);
		var cloneProcess = git.clone(getGitProtocol(options)+ owner+ "/" + repo, outputDir + '/' + repo, function(err, _repo) {
			if(err) sys.puts(err);
			if(callback)
    			callback(repo)
	  	})
  	}	
}

function getVagrantRepo(repo) {
	var vagrantYml = yaml.load(repoFolder+repo +'/.vagrant.yml');
	var vagrantRepo = vagrantYml.repo;
	return {owner:vagrantRepo.split('/')[0], repo:vagrantRepo.split('/')[1]};
}

function getVagrantRepoFromString(ymlStr) {
	var vagrantYml = yaml.parse(ymlStr);
	var vagrantRepo = vagrantYml.repo;
	return {owner:vagrantRepo.split('/')[0], repo:vagrantRepo.split('/')[1]};
}

function getVGitYml(repo) {
	return yaml.load(repoFolder+repo +'/.vgit.yml');
}

function displayVGitYml(repo) {
	var vgitYml = getVGitYml(repo);
	if (vgitYml.provision) console.log('provision: ' + vgitYml.provision + '\n')
	if (vgitYml.description) console.log('description: ' + vgitYml.description + '\n')
	if (vgitYml.hint) console.log('hint: ' + vgitYml.hint + '\n')
	if (vgitYml.username) console.log('username: ' + vgitYml.username + '\n')
	if (vgitYml.password) console.log('password: ' + vgitYml.password + '\n')
}

function perform(options, owner, repo, vagrantCmd) {
	console.log('####################### git output ##########################');
	var url = gitRaw + owner + "/" + repo + "/master/.vagrant.yml"
	fetchUrl(url, function(error, meta, body){
	    console.log(body.toString());
	    var vagrantRepo = getVagrantRepoFromString(body.toString());
	    fetchRepo(options, vagrantRepo.owner, vagrantRepo.repo, '', 'vagrant project', function(_repo) {
			fetchRepo(options, owner, repo, vagrantRepo.repo + "/project", 'project', function(_repo){
				console.log('#############################################################');
				console.log('##################### vagrant project info ##################');
				displayVGitYml(vagrantRepo.repo);
				console.log('start vagrant ' + vagrantCmd + ' in folder ' + repo);
				console.log('################ vagrant process output #####################');
				var vagrant = exec("vagrant " + vagrantCmd,{cwd: repoFolder + vagrantRepo.repo, maxBuffer: 1024*1024}, function (error, stdout, stderr) { 			
				});
				//FIXME added file log
				vagrant.stdout.on('data', function(data) { process.stdout.write(data); });
				vagrant.stderr.on('data', function(data) { process.stderr.write(data); });
				vagrant.on('close', function(code) { 
					console.log('##############################################################');
					console.log('closing code: ' + code);
				});
			});
		});
	});
}

function Cli(argv) {
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
		if (options.up) {
			console.log('vagrant up');
			perform(options, owner, repo, "up");
		} else if (options.prov) {
			console.log('vagrant provision');
			perform(options, owner, repo, "provision");
		} else {
			console.log('default command vagrant up');
			perform(options, owner, repo, "up");
		}
	} else {
		console.log('Usage options \n--g (https or git protocol git is default)\n--o (for differennt output folder than working dir optional)  \n--repo (owner/repo for example pussinboots/vagrant-git mandatory) \n--up (to perform vagrant up default command optional) \n--prov (to perform vagrant provision optional)');
	}
}
module.exports = Cli;
