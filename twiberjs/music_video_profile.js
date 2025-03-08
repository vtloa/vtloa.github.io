<!-- Мелодия в профиле -->

<script language="javascript">
$('td#profile-right li:has(span:contains("Музыка"))').map(function(){var Ku=$('strong',this).html();
if(Ku.match(/.mp3/)){plr=/(https?:\/\/[^\s<"]+?\.mp3)/gi; Ku=Ku.replace(plr,'<audio src="$1" controls style="width: 190px !important;"></audio>');};$('strong',this).html(Ku);});
$('li[class^="pa-fld"]:contains("Музыка")').map(function(){
var lm=$(this).text();if(!lm){return false;};
if(lm.match(/.mp3/)){var plr=/Музыка\:(https?:\/\/[^\s<"]+?\.mp3)/gi;
lm=lm.replace(plr,'Музыка:<br><audio src="$1" controls style="width: 190px !important;"></audio>');};$(this).html(lm);});
</script>



<!-- ВИДЕО в профиле -->

<script language="javascript">
$('td#profile-right li:has(span:contains("Видео"))').map(function() {
    var Ku = $('strong', this).html();
    if (Ku.match(/https?:\/\/(www\.)?youtube\.com\/watch\?v=/)) {
        var ytRegex = /(https?:\/\/(www\.)?youtube\.com\/watch\?v=([^\s<"]+))/gi;
        Ku = Ku.replace(ytRegex, '<iframe width="190" height="107" src="https://www.youtube.com/embed/$3" frameborder="0" allowfullscreen></iframe>');
    }
    $('strong', this).html(Ku);
});

$('li[class^="pa-fld"]:contains("Видео")').map(function() {
    var lm = $(this).text();
    if (!lm) {
        return false;
    }
    if (lm.match(/https?:\/\/(www\.)?youtube\.com\/watch\?v=/)) {
        var ytRegex = /Видео\:(https?:\/\/(www\.)?youtube\.com\/watch\?v=([^\s<"]+))/gi;
        lm = lm.replace(ytRegex, 'Видео:<br><iframe width="190" height="107" src="https://www.youtube.com/embed/$3" frameborder="0" allowfullscreen></iframe>');
    }
    $(this).html(lm);
});
</script>
