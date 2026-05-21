/**
 * Phase 3: Pre-Analysis Enrichment
 * Add stroke counts, five elements, gender inference, frequency tiers
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const STROKE_DB: Record<string, number> = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'data', 'stroke-database.json'), 'utf-8')
)

const hanvietNames = JSON.parse(
  readFileSync(join(__dirname, 'hanviet-names.json'), 'utf-8')
)

console.log('=== Phase 3: Pre-Analysis Enrichment ===\n')

// Simplified five elements by common radicals
const ELEMENT_MAP: Record<string, string> = {}
// Kim
'金钅钆钇针钉钊钋钌钍钎钏钐钒钓钔钕钗钙钚钛钜钝钞钟钠钡钢钣钤钥钦钧钩钫钪钬钭钮钯钰钱钲钳钴钵钶钷钸钹钺钻钼钽钾钿铀铁铂铃铅铆铈铉铊铋铌铍铎铐铑铒铕铖铘铙铛铜铝铟铥铧铨铩铪铫铬铭铮铯铰铱铳铵银铷铸铹铺铻铼铽链铿销锂锃锄锅锆锇锈锉锊锋锌锍锎锏锐锑锒锓锔锕锖锗锘错锚锛锜锝锞锟锠锡锢锣锤锥锦锨锩锪锫锬锭键锯锰锱锲锴锵锷锸锹锺锻锼锽锾锿镀镁镂镃镄镅镆镇镈镉镊镋镌镍镎镏镐镑镒镓镔镕镖镗镘镙镛镜镝镞镟镠镡镢镣镤镥镦镧镨镩镪镫镬镭镯镱镲镳镴镵镶'.split('').forEach(c => ELEMENT_MAP[c] = 'Kim')
// Mộc
'木朩未末本札术朱朴朵机朽杀杂权杆杈杉李杏材村杓杜杞束杠来杨杩杯杰杲杳杷杼松板枇枉枋析林枚果枝枢枣枥枦枧枨枪枫枭柜枇枰枱枳架枷枸枹枺枻枼枽枾枿柀柁柂柃柄柅柆柇柈柉柊柏某柑柒染柔柘柙柚柜柝柞柠柢查柤柦柧柨柩柬柯柰柱柿栀栉标栈栊栋栌栎栏树栓栖栗校栩株栝栞栟栠栢栣栤栦栧栨森梅兰竹菊柏松桃柳桂杏枫桦楠桐槐榆楷檀樱莲荷荔芒芝芙蓉萍芹萄薇芷芯菲萌菁菡菱菀菩'.split('').forEach(c => ELEMENT_MAP[c] = 'Mộc')
// Thủy
'水氵氺永氾氿汀汁求汆汇汉汊汋汐汔汕汗汘污汛汜汝汞江池汤汧汨汩汪汫汬汭汰汯汲汳汴汵汶汷汸汹決汻汼汽汾汿沀沁沂沃沄沅沆沇沈沉沌沏沐沓沔沕沖沙沛沘沟没沚沢沜沝沞沠沪沫沬沮沯沰沱沲河沸油治沼沽沾沿泀況泃泄泅泆泇泉泊泌泍泎泏泐泑泒泓泔法泖泗泘泙泛泜泝泞泟泠泡波泣泥注泫泬泭泮泯泰泱泳泵泶泷泸泹泺泻泼泽泾洁洋洒洗洙洚洛洞洟涕洡洢洣津洧洨洩洪洫洬洭洮洯洰洱洲洴洵洶洷洸洹洺活洼洽派流浃浅浆浇浈浊测浍济浏浑浒浓浔浙浖浗浘浚浛浜浝浞浟浠浡浢浣浤浥浦浧浨浩浪浮浴海浸涂涅淌淑淖淘淙淛淜淝淞淟淠淡淤淥淦净淩淪淫淬淭淮淯深淲淳淵淶混淸淹淺添淼清渊渌渍渎渐渑渖渚渝渟渠渡渣渤渥渦涣涤润涧涨涩涮涵涔涓涖涘涛涝涞涟涠涡涢涥涪涫涬涮涰涱涯涳涴涵涶涷涸涹涺涻凉涽涾涿淀淖淟淠淡淤淥淦净淩淪淫淬淮淯深淳淵淶混淹淺添淼清渊渌渍渎渐渑渖渚渝渟渠渡渣渤渥渦涣涤润涧涨涩涮涵涔涓涛涝涞涟涠涡涢涥涪涫涬淦净淩淪淫淬淮淯深淳淵淶混淹淺添淼清渊渌渍渎渐渑渖渚渝渟渠渡渣渤渥渦涣涤润涧涨涩涮涵涔涓涛涝涞涟涠涡涢涥涪涫涬淦净淩淪淫淬淮淯深淳淵淶混淹淺添淼清渊渌渍渎渐渑渖渚渝渟渠渡渣渤渥渦涣涤润涧涨涩涮涵涔涓涛涝涞涟涠涡涢涥涪涫涬淦净淩淪淫淬淮淯深淳淵淶混淹淺添淼清渊渌渍渎渐渑渖渚渝渟渠渡渣渤渥渦涣涤润涧涨涩涮涵涔涓涛涝涞涟涠涡涢涥涪涫涬霖霈霎霏霁霭霸露霜雪雨冰凝冷凉凌冬寒'.split('').forEach(c => ELEMENT_MAP[c] = 'Thủy')
// Hỏa
'火灬灺灻灼灾灿炀炁炂炃炄炅炆炇炈炉炊炎炒炔炕炖炗炘炙炚炛炜炝炟炠炡炢炣炤炥炦炧炨炩炪炫炬炭炮炯炱炲炳炴炵炶为炷炸点炻炼炽烀烁烂烃烈烊烋烌烍烎烏烐烑烒烓烔烕烖烘烙烛烜烝烟烤烦烧烨烮烲烳烴烵烶烸烫烬热烺烯烻烼焀焁焂焃焄焅焆焇焈烽焋焌焍焎焊焐焑焒焓焔焕焖焗焘焙焚焛焜焝焞焟焠無焢焣焤焥焦焧焨焩焪焫焬焭焮焯焰焱焲焳焴焵然焷焸焹焺焻焼焽焾焿煀煁煂煃煄煅煆煇煉煈炎煜煋煌煎煍煏煐煑煒煓煔煕煖煗煘煙煚煛煜煝煞煟煠煡煢煣煤煥照煨煩煪煫煬煭煮煯煰煱煲煳煴煵煶煷煸煹煺煻煼煽煾煿熀熁熂熃熄熅熆熇熈熉熋熌熍熎熐熑熒熓熔熕熖熗熘熙熚熛熜熝熞熟熡熢熣熤熥熦熧熨熩熪熫熬熭熮熯熰熱熲熳熴熵熶熷熸熹熺熻熼熽熾熿燀燁燂燃燄燅燆燇燈燉燊燋燌燍燎燏燐燑燒燓燔燕燖燗燘燙燚燛燜燝燞營燠燡燢燣燤燥燦燧燨燩燪燫燬燭燮燯燰燱燲燳燴燵燶燷燸燹燺燻燼燽燾燿爀爁爂爃爄爅爆爇爈爉爊爋爌爍爎爏爐爑爒爓爔爕爖爗爘爙爚爛爜爝爞爟爠爡爢爣爤爥爦爧爨爩'.split('').forEach(c => ELEMENT_MAP[c] = 'Hỏa')
// Thổ
'土圠圡圢圣圤圥圦压圪圫圬圭圮圯地圱圲圳圴圵圶圷圸圹场圻圼圽圾址坂坁坃坄坅坆均坈坉坊坋坌坍坎坏坐坑坒坓坔坕坖块坘坙坚坛坜坝坞坟坠坡坢坣坤坥坦坧坨坩坪坫坬坭坮坯坰坱坲坳坴坵坶坷坸坹坺坻坼坽坾坿垀垁垂垇垈垉垊型垌垍垎垏垐垑垒垓垔垕垖垗垘垙垚垛垜垝垞垟垠垡垢垣垤垥垦垧垨垩垪垫垬垭垮垯垰垱垲垳垴垵垶垷垸垹垺垻垼垽垾垿埀埁埂城埄埅埆埇埈埉埊埋埌埍城埏埐埑埒埓埔埕埖埗埘埙埚埛埝埞域埠埡埢埣埤埥埦埧埨埩埪埫埬埭埮埯埰埱埲埳埴埵埶執埸培基埻埼埽堂堃堄堅堇堈堉堊堋堌堍堎堏堐堑堕堒堓堔埂堖堗堘堙堚堛堜堝堞堟堠堡堢堣堤堥堦堧堨堩堪堫堬堭堮堯堰報堲堳場堵堶堷堸堹堺堻堼堾堿墀墁墂境墄墅墆墇墈墉墊墋墌墍墎墏墐墑墒墓墔墕墖増墘墙墚墛墜墝增墟墠墡墢墣墤墥墦墧墨墩墪墫墬墭墮墯墰墱墲墳墴墵墶墷墸墹墺墻墼墽墾墿壀壁壂壃壄壅壆壇壈壉壊壋壌壍壎壏壐壑壒壓壔壕壖壗壘壙壚壛壜壞壝壟壠壡壢壣壤壥壦壧壨壩壪'.split('').forEach(c => ELEMENT_MAP[c] = 'Thổ')

const FEMALE_CHARS = new Set('婷娜娟娇媚娥媛婉淑贞雅静丽美秀芳芬珍珠琳珊瑚琥珀玫瑰琪琦瑶瑾璇璐璧环佩玲珑珂燕莺蝶鸳鸯蝉萤蓉萍芹萄薇芷芯菲萌菁菡菱菀菩莲荷桃柳桂樱荔芝芙花草兰竹菊梅雪冰霜露霞虹霓云月星辰玉琼嫦娥婵娴倩妮颖莹琼黛'.split(''))
const MALE_CHARS = new Set('伟杰俊英华强刚毅坚固钢铁铜锋锐利剑刀枪炮弹弓箭盾甲盔铠武勇猛雄豪壮健龙虎狮豹狼鹰鹏鹤鲲鳌麟麒志宏博学知识达功建立平福寿喜振宇广江锦民鸿浩旭鑫高莹焕宪伯彦铭怀聪磊昭科宗雷仙凌栋章盛轩绍满邦真翰瀚斌斐斯普景晶暑雯雁雄'.split(''))

function getStrokes(char: string): number {
  return STROKE_DB[char] || 0
}

function getElement(char: string): string | null {
  return ELEMENT_MAP[char] || null
}

function inferGender(givenName: string): { gender: string; confidence: number } {
  const chars = givenName.split('')
  let femaleScore = 0
  let maleScore = 0
  for (const char of chars) {
    if (FEMALE_CHARS.has(char)) femaleScore++
    if (MALE_CHARS.has(char)) maleScore++
  }
  const total = femaleScore + maleScore
  if (total === 0) return { gender: 'neutral', confidence: 0 }
  if (femaleScore > maleScore) return { gender: 'female', confidence: femaleScore / total }
  if (maleScore > femaleScore) return { gender: 'male', confidence: maleScore / total }
  return { gender: 'neutral', confidence: 0 }
}

function getFrequencyTier(index: number, total: number): string {
  const percentile = index / total
  if (percentile < 0.2) return 'common'
  if (percentile < 0.6) return 'standard'
  return 'rare'
}

const enriched: any[] = []
let noStrokes = 0
let noElement = 0

for (let i = 0; i < hanvietNames.length; i++) {
  const name = hanvietNames[i]
  const allChars = (name.surname + name.givenName).split('')
  const givenChars = name.givenName.split('')

  const strokes = allChars.map(getStrokes)
  if (strokes.some(s => s === 0)) noStrokes++

  const fiveElements = givenChars.map(getElement).filter(e => e !== null)
  if (fiveElements.length === 0) noElement++

  const gender = inferGender(name.givenName)
  const frequency = getFrequencyTier(i, hanvietNames.length)

  enriched.push({
    hanzi: name.hanzi,
    hanViet: name.givenNameHanViet,
    surnameHanzi: name.surname,
    surnameHanViet: name.surnameHanViet,
    givenNameHanzi: name.givenName,
    givenNameHanViet: name.givenNameHanViet,
    strokes,
    fiveElements,
    gender: gender.gender,
    genderConfidence: Math.round(gender.confidence * 100) / 100,
    frequency,
    meaning: '',
    culturalSignificance: '',
  })
}

console.log(`Total names enriched: ${enriched.length}`)
console.log(`Missing stroke counts: ${noStrokes}`)
console.log(`Missing five elements: ${noElement}`)

const genderDist: Record<string, number> = {}
for (const e of enriched) genderDist[e.gender] = (genderDist[e.gender] || 0) + 1
console.log('\nGender distribution:')
for (const [g, c] of Object.entries(genderDist)) console.log(`  ${g}: ${c.toLocaleString()}`)

const freqDist: Record<string, number> = {}
for (const e of enriched) freqDist[e.frequency] = (freqDist[e.frequency] || 0) + 1
console.log('\nFrequency distribution:')
for (const [f, c] of Object.entries(freqDist)) console.log(`  ${f}: ${c.toLocaleString()}`)

console.log('\nSample enriched names:')
for (const e of enriched.slice(0, 10)) {
  console.log(`  ${e.hanzi} → ${e.surnameHanViet} ${e.givenNameHanViet}`)
  console.log(`    strokes: [${e.strokes}], elements: [${e.fiveElements.join(', ')}]`)
  console.log(`    gender: ${e.gender} (${e.genderConfidence}), frequency: ${e.frequency}`)
}

writeFileSync(join(__dirname, 'enriched-names.json'), JSON.stringify(enriched, null, 2), 'utf-8')
console.log(`\nWritten: enriched-names.json (${enriched.length} names)`)
console.log('\n=== Phase 3 Complete ===')
