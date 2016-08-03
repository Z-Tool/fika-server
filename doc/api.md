## API列表


## associate(word, type, dictionaries)

联想单词

#### word `String` `Required`

要进行联想的单词

#### type `String`

联想类型, 默认使用同字联想

目前支持的联想类型

- 同音联想 voice
- 同字联想 text

#### categories `Array(String)|String`

选择在那些类别中进行联想


#### dictionaries `Array(String)|String`

使用哪个字典进行联想


## snake(word, size, categories, dictionaries)

单词接龙

#### word `String`

开始接龙的单词, 如果没有单词，则第一个也是随机产生

#### size `Number`

接龙的长度, 默认值为`10`

#### categories `Array(String)|String`

选择类别进行接龙

#### dictionaries `Array(String)|String`

选择字典进行接龙
