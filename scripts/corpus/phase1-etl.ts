/**
 * Phase 1: ETL - Clone, Parse, Clean
 * Parse Chinese Names Corpus, deduplicate, filter, split surname+givenName
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORPUS_DIR = join(__dirname, 'Chinese-Names-Corpus', 'Chinese_Names_Corpus')
const OUTPUT_DIR = join(__dirname)

// Common Chinese surnames (top 500 by frequency)
const COMMON_SURNAMES = new Set([
  '王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','马','朱','胡',
  '郭','何','林','高','梁','郑','谢','宋','唐','许','韩','冯','邓','曹','彭',
  '曾','肖','田','董','袁','潘','于','蒋','蔡','余','杜','叶','程','魏','苏',
  '吕','丁','任','沈','姚','卢','姜','崔','钟','谭','陆','汪','范','金','石',
  '廖','贾','韦','夏','付','方','邹','熊','白','孟','秦','邱','侯','江','史',
  '顾','邵','龙','万','段','雷','钱','汤','尹','黎','易','常','武','乔','贺',
  '赖','龚','文','毛','邱','秦','江','史','顾','邵','龙','万','段','雷','钱',
  '汤','尹','黎','易','常','武','乔','贺','赖','龚','文','毛','戴','莫','孔',
  '向','严','覃','洪','龚','施','柯','阮','柴','纪','梅','蓝','柯','管','卢',
  '柴','纪','梅','蓝','柯','管','符','毕','祁','牟','滕','殷','罗','毕','郝',
  '邬','安','常','乐','于','时','傅','皮','卞','齐','康','伍','余','元','卜',
  '顾','孟','平','黄','和','穆','萧','尹','姚','邵','湛','汪','祁','毛','禹',
  '狄','米','贝','明','臧','计','伏','成','戴','谈','宋','茅','庞','熊','纪',
  '舒','屈','项','祝','董','梁','杜','阮','蓝','闵','席','季','麻','强','贾',
  '路','娄','危','江','童','颜','郭','梅','盛','林','刁','钟','徐','邱','骆',
  '高','夏','蔡','田','樊','胡','凌','霍','虞','万','支','柯','昝','管','卢',
  '莫','经','房','裘','缪','干','解','应','宗','丁','宣','贲','邓','郁','单',
  '杭','洪','包','诸','左','石','崔','吉','钮','龚','程','嵇','邢','滑','裴',
  '陆','荣','翁','荀','羊','於','惠','甄','曲','家','封','芮','羿','储','靳',
  '汲','邴','糜','松','井','段','富','巫','乌','焦','巴','弓','牧','隗','山',
  '谷','车','侯','宓','蓬','全','郗','班','仰','秋','仲','伊','宫','宁','仇',
  '栾','暴','甘','钭','厉','戎','祖','武','符','刘','景','詹','束','龙','叶',
  '幸','司','韶','郜','黎','蓟','薄','印','宿','白','怀','蒲','邰','从','鄂',
  '索','咸','籍','赖','卓','蔺','屠','蒙','池','乔','阴','胥','能','苍','双',
  '闻','莘','党','翟','谭','贡','劳','逄','姬','申','扶','堵','冉','宰','郦',
  '雍','郤','璩','桑','桂','濮','牛','寿','通','边','扈','燕','冀','郏','浦',
  '尚','农','温','别','庄','晏','柴','瞿','阎','充','慕','连','茹','习','宦',
  '艾','鱼','容','向','古','易','慎','戈','廖','庾','终','暨','居','衡','步',
  '都','耿','满','弘','匡','国','文','寇','广','禄','阙','东','欧','殳','沃',
  '利','蔚','越','夔','隆','师','巩','厍','聂','晁','勾','敖','融','冷','訾',
  '辛','阚','那','简','饶','空','曾','毋','沙','乜','养','鞠','须','丰','巢',
  '关','蒯','相','查','后','荆','红','游','竺','权','逯','盖','益','桓','公',
  '慕容','上官','欧阳','夏侯','诸葛','闻人','东方','赫连','皇甫','尉迟','公羊',
  '澹台','公冶','宗政','濮阳','淳于','单于','太叔','申屠','公孙','乐正','轩辕',
  '令狐','钟离','宇文','长孙','慕容','鲜卑','司徒','司空','司寇','南宫','第五',
])

// Surnames sorted by length (longest first) for greedy matching
const SURNAMES_BY_LENGTH = [...COMMON_SURNAMES].sort((a, b) => b.length - a.length)

function splitName(fullName: string): { surname: string; givenName: string } | null {
  // Try 2-char compound surnames first
  for (const surname of SURNAMES_BY_LENGTH) {
    if (fullName.startsWith(surname) && fullName.length > surname.length) {
      const givenName = fullName.slice(surname.length)
      if (givenName.length >= 1 && givenName.length <= 3) {
        return { surname, givenName }
      }
    }
  }
  return null
}

function isBadCase(name: string): boolean {
  // Too short or too long
  if (name.length < 2 || name.length > 6) return true
  // Contains non-Chinese characters
  if (!/^[\u4e00-\u9fff\u3400-\u4dbf]+$/.test(name)) return true
  // Starts with 阿 (nickname prefix, not formal name)
  if (name.startsWith('阿')) return true
  // Repeated characters only (e.g., 冰冰冰)
  if (new Set(name).size === 1 && name.length > 1) return true
  // Contains numbers or punctuation
  if (/[0-9a-zA-Z\s\.\,\!\?\;\:\(\)\[\]\{\}]/.test(name)) return true
  return false
}

function parseCorpusFile(filePath: string): string[] {
  if (!existsSync(filePath)) {
    console.log(`  Skipping: ${filePath} (not found)`)
    return []
  }
  const content = readFileSync(filePath, 'utf-8')
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('By@') && !/^\d{4}\.\d{2}\.\d{2}$/.test(line))
}

// Phase 1: Parse and clean
console.log('=== Phase 1: ETL - Parse, Clean, Filter ===\n')

console.log('1. Parsing Chinese_Names_Corpus (1.2M)...')
const modernNames = parseCorpusFile(join(CORPUS_DIR, 'Chinese_Names_Corpus（120W）.txt'))
console.log(`   Raw: ${modernNames.length} names`)

console.log('2. Parsing Ancient_Names_Corpus (250K)...')
const ancientNames = parseCorpusFile(join(CORPUS_DIR, 'Ancient_Names_Corpus（25W）.txt'))
console.log(`   Raw: ${ancientNames.length} names`)

const allRaw = [...modernNames, ...ancientNames]
console.log(`\n   Total raw: ${allRaw.length} names`)

// Deduplicate
const uniqueNames = [...new Set(allRaw)]
console.log(`   After dedup: ${uniqueNames.length} names`)

// Filter bad cases
const filtered = uniqueNames.filter(name => !isBadCase(name))
console.log(`   After badcase filter: ${filtered.length} names`)

// Split into surname + givenName
const splitResults: { fullName: string; surname: string; givenName: string }[] = []
let unsplitCount = 0

for (const name of filtered) {
  const result = splitName(name)
  if (result) {
    splitResults.push({ fullName: name, surname: result.surname, givenName: result.givenName })
  } else {
    unsplitCount++
  }
}

console.log(`   Successfully split: ${splitResults.length} names`)
console.log(`   Could not split: ${unsplitCount} names (no recognized surname)\n`)

// Count by given name length
const lengthDist: Record<number, number> = {}
for (const r of splitResults) {
  const len = r.givenName.length
  lengthDist[len] = (lengthDist[len] || 0) + 1
}
console.log('   Given name length distribution:')
for (const [len, count] of Object.entries(lengthDist).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`     ${len} char: ${count.toLocaleString()}`)
}

// Limit to 50K for initial batch - prioritize by given name length (2-char is most common/useful)
const targetCount = 50000
const twoCharNames = splitResults.filter(r => r.givenName.length === 2)
const oneCharNames = splitResults.filter(r => r.givenName.length === 1)
const threeCharNames = splitResults.filter(r => r.givenName.length === 3)

const selected: typeof splitResults = []

// Take all 2-char given names first (most useful), then 1-char, then 3-char
for (const pool of [twoCharNames, oneCharNames, threeCharNames]) {
  if (selected.length >= targetCount) break
  const remaining = targetCount - selected.length
  selected.push(...pool.slice(0, remaining))
}

console.log(`\n   Selected for batch: ${selected.length} names`)
console.log(`     2-char given names: ${selected.filter(r => r.givenName.length === 2).length}`)
console.log(`     1-char given names: ${selected.filter(r => r.givenName.length === 1).length}`)
console.log(`     3-char given names: ${selected.filter(r => r.givenName.length === 3).length}`)

// Write output
const output = selected.map(r => ({
  hanzi: r.fullName,
  surname: r.surname,
  givenName: r.givenName,
}))

writeFileSync(join(OUTPUT_DIR, 'clean-names.json'), JSON.stringify(output, null, 2), 'utf-8')
console.log(`\n   Written: clean-names.json (${output.length} names)`)
console.log('\n=== Phase 1 Complete ===')
