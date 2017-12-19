# ymap-utils
YMAP Utils
```
Usage: ymap [options]

  YMAP toolkit


  Options:

    -V, --version               output the version number
    -i,   --inject2ytp          Inject YMAP to YTYP
    -f,   --find                Find YMAP
    -yt,  --ytyp      [file]    YTYP file
    -ym,  --ymap      [file]    YMAP file
    -r,   --room      [name]    Room name
    -pos, --position  <pos>     Initial position => x,y,z
    -rot, --rotation  <rot>     Initial rotation => x,y,z,w
    -n,   --name      [name]    Output file name without extension
    -r,   --radius    [radius]  Radius
    -h, --help                  output usage information

  Examples:

    ymap --find --position 1009.54500000,-3196.59700000,-39.99353000 --radius 25
    ymap --inject2ytp --ytyp bkr_biker_dlc_int_ware01.ytyp.xml --ymap weed2.ymap.xml --room MethMain --position 1009.54500000,-3196.59700000,-39.99353000 --rotation 0.0,0.0,0.0,1.0 --name merged
```

```
 Usage: ytyp [options]

  YTYP toolkit


  Options:

    -V, --version                  output the version number
    -gp,  --genprops               Generate props definitions
    -yt,  --ytyp      [file]       YTYP file
    -d    --directory [directory]  Directory
    -h, --help                     output usage information

  Examples:
    ytyp --genprops --dir ./props/stream
    ytyp --genprops --ytyp props_def.ytyp.xml
```

