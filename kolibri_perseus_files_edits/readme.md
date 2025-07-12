This set of scripts replaces decimal points with commas in all Kolibri exercises that are packaged in `.perseus` files.

### How to use
1. Copy all `.perseus` files of interest to a specific directory
2. Unzip the `.perseus` files using script 1_unzip_perseus_files.sh
3. Run regex replacement scripts, passing in directory of unzipped `.perseus` files
4. Replace the `.perseus` files in the content pack with the processed files
	
#### Notes
- `.perseus` files are archives containing `.json` files. The exercises are represented in a similar format to laTex (special symbols interspersed with plain text), which makes direct "find and replace" operations produce poor results.
- The deimal point/comma replacement is done using regex capture. Bash uses similar regex capture syntax to sublimetext editor
	e.g
	
	To replace the decimal point separator with a comma separator:
		Search string : ([[:digit:]]+)\.([[:digit:]]+)
		Replace string: $1\,$2
