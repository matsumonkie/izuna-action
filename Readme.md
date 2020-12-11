# izuna-action

This action create a tar archive of your hie files and send it to izuna server so they can be processed.
Note that it does not generate your hie files. You need to do that yourself by modifying your stack file:

```yaml
ghc-options:
  - -fwrite-ide-info
  - -hiedir=.hie
```

Or your cabal file:

```cabal
  ghc-options: -fwrite-ide-info -hiedir=.hie
```

## Usage

a simple usage is:
```yaml
    - name: build project info for izuna
      uses: matsumonkie/izuna-action@v0.43
      with:
        owner: 'matsumonkie'
        repository: 'izuna-example'
        package: 'izuna-example'
        ghcVersion: '8.10.1'
        hieDirectory: '.hie/'
```

Note that all parameters are required and cannot be empty.
Note that ghcVersion can only be 8.10.1 for now. 8.10.2 will be available soon.

## Example usage

[izuna-example](https://github.com/matsumonkie/izuna-example/) is using this github-action. You might want to check the [main.yaml](https://github.com/matsumonkie/izuna-example/blob/main/.github/workflows/main.yml#L39-L46) file for a complete usage!

## Build the action

run: `npm run all`
