const fs = require('fs')


for ( let i = 2; i < process.argv.length; i++ ) {
  const file = fs.readFileSync( process.argv[i] )
  let delfilename = process.argv[i].replace(/tests/, "del")

  let bundle = JSON.parse(file.toString())

  bundle.id.replace(/tests/, "del")
  for( let entry of bundle.entry ) {
    delete entry.resource
    entry.request.method = "DELETE"
  }

  fs.writeFileSync( delfilename, Buffer.from( JSON.stringify(bundle)))

}