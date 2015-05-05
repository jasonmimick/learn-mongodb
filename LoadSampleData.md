Load Sample Data
=

You should have a locally running ``mongod`` before attempting this step.

Download the [sampledata.zip](sampledata.zip) file to your laptop, this contains a few different

Unzip and inspect the files in the sampledata folder, what do you see?

Use the ``mongorestore`` tool to load data into your ``mongod``, and then
shell in and inspect the data you loaded.

*Hint*: There is a directory called ``dump`` in the extracted zip file. You'll need the path to this
directory when you run ``mongorestore``. Additionally, for this exercise, you want to load all the
collections from the zip file into your ``mongod`` instance.

You should see the following databases:
```
> show dbs
fruits    0.031GB
local     0.031GB
students  0.031GB
stuff     0.031GB
>
```

