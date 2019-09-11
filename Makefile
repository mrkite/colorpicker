TS = src/helper.ts src/picker.ts src/wheel.ts

.DELETE_ON_ERROR:

all: cp_min.js

cp_min.js: colorpicker.js
	terser --compress --mangle --mangle-props reserved=['ColorPicker','Picker','pick','toNumber','toString'] --ecma 7 -o $@ -- $^

colorpicker.js: $(TS)
	tsc

check:
	tslint --project tsconfig.json

clean:
	rm -f colorpicker.js cp_min.js
