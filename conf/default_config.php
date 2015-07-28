<?php
$conf = array();

$conf['git'] = FALSE;
$conf['git_path'] = "/usr/bin/git";

try{
	if(!include "conf/config.php"){
		$fp = fopen('conf/config.php', 'w');
		if($fp){
			// Automatically detect Git support and enable if detected.
			// This check is so basic that only existence of git binary is checked.
			$conf['git'] = (include_once 'gitphp/Git.php') && stat(Git::get_bin());
			if($conf['git'])
				$conf['git_path'] = Git::get_bin();
			fwrite($fp, "<?php\n" .
				'$conf[\'git\'] = ' . ($conf['git'] ? 'TRUE' : 'FALSE') . ";\n" .
				'$conf[\'git_path\'] = "' . addslashes($conf['git_path']) . "\";\n");
			fclose($fp);
		}
	}
}
catch(Exception $e){
	echo $e->getMessage();
}

