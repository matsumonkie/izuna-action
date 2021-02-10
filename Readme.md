# izuna-action

## How to install

### Install the chrome extension

Go to the [chrome webstore](https://chrome.google.com/webstore/detail/izuna/fdddagbfkgicjkeijmbfdcmjeldegfdi) and install the chrome extension.

### Add Github Action to your project

To install izuna, you need to have github action enabled for your project. This simply means having a `.github/workflows/main.yml` file in your project. See documentation for [Github action with Haskell](https://github.com/haskell/actions/tree/main/setup)


### Generate Hie

Once you have your project ready to build with Github action, you need to add the hie generation option to your build process.
This can be done in multiple ways:

1. modify your stack file:

```yaml
ghc-options:
  - -fwrite-ide-info
  - -hiedir=.hie
```

2. modify your cabal file:

```cabal
  ghc-options: -fwrite-ide-info -hiedir=.hie
```

3. modify the build command:

If you don't feel like modifying your stack or cabal file, you can simply add add an instruction in your `main.yml` file to rebuild with hie enabled:

```yaml
    - name: Build your project with hie files generation
      run: |
        stack build --ghc-options="-fwrite-ide-info -hiedir=.hie" --force-dirty
```
`--force-dirty` is only mandatory if you have already instruct github to build your project in the `main.yml` file. It will force a recompilation of you're project and make sure the hie files are hence correctly generated.

### Run izuna-action

Finally, you need to add izuna-action to your `main.yml` file.

izuna-action creates a tar archive of your hie files and sends it to izuna server so they can be further processed (then deleted, we do not keep the hie files).

This is done like this:
```yaml
    - name: izuna for izuna-builder
      uses: matsumonkie/izuna-action@v1.0
      with:
        ghcVersion: '8.10.1'
        hieDirectory: 'izuna-builder/.hie/'
        projectRoot: 'izuna-builder/'
```

`hieDirectory` is the path where the hie files will be store in your project (e.g: usually `".hie/"`)
`projectRoot` is the path where your src/ folder lies (usually: `"./"`)
Note that all parameters are required and cannot be empty.
Note that `ghcVersion` can only be `8.10.1` or `8.10.2` at the moment. More recent versions will be available soon.

## Full example usage

The Izuna project is using izuna-action and can be read [here](https://github.com/matsumonkie/izuna-example/blob/main/.github/workflows/main.yml#L44-L49) for a complete usage!

## Dev

run: `npm run all`
