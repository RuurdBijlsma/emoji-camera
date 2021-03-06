<template>
    <div id="app">
        <md-dialog :md-active.sync="showSettings" class="settings-dialog">
            <md-dialog-title>Preferences</md-dialog-title>

            <md-list>
                <md-list-item>
                    <md-field>
                        <label>Emoji resolution</label>
                        <md-input v-model="emojiWidth" type="number"></md-input>
                    </md-field>
                </md-list-item>

                <md-list-item>
                    <md-switch v-model="showVideoBack">Show video background</md-switch>
                </md-list-item>

                <md-list-item>
                    <md-field>
                        <label for="palette-select">Quick palette</label>
                        <md-select id="palette-select" v-model="emojiPalette">
                            <md-option v-for="palette in paletteOptions" :value="palette.emojis">{{palette.name}}
                            </md-option>
                        </md-select>
                    </md-field>
                </md-list-item>
            </md-list>

            <md-dialog-actions>
                <md-button class="md-primary" @click="showSettings = false; updateSettings()">Save & close</md-button>
            </md-dialog-actions>
        </md-dialog>

        <md-content>
            <canvas :style="`transform: scaleX(${frontFacing?'-1':'1'});`" v-show="showVideoBack"
                    class="render-output"></canvas>
            <div :style="`transform: scaleX(${frontFacing?'-1':'1'});`" class="emoji-output"></div>

            <md-button @click="frontFacing = !frontFacing; changeCamera()" class="md-icon-button change-button">
                <md-icon>cached</md-icon>
            </md-button>

            <md-button @click="downloadPicture()" class="md-icon-button md-raised camera-button md-accent">
                📷
            </md-button>

            <md-button @click="showSettings=!showSettings" class="md-icon-button settings-button">
                <md-icon>settings</md-icon>
            </md-button>
        </md-content>

        <md-snackbar md-position="center" :md-duration="5000" :md-active.sync="showSnackbar" md-persistent
                     class="snackbar">
            <span>Picture saved!</span>
        </md-snackbar>
    </div>
</template>

<script>
    import EmojiMapManager from '@/js/EmojiMapManager';
    import EmojiSplitter from '@/js/EmojiSplitter';
    import LabConvert from '@/js/LabConvert';
    import * as PIXI from 'pixi.js';

    export default {
        name: 'app',
        components: {},
        data() {
            return {
                showSnackbar: false,
                showVideoBack: true,
                showSettings: false,
                canvas: null,
                context: null,
                video: null,
                videoCrop: [],
                paletteOptions: [
                    {
                        name: 'Default',
                        emojis: `😂💯🙈😡😍😱👌👌🏻👌🏼👌🏽👌🏾👌🏿🤡😈🤢👹👾🤖👻💩💍💋👅👄👥👀🎒👛👘👒👗👔👖👚👠🐾🌴🍃🌏🌓🌝🍏🍎🍋🥝🍳🥚🍖🏀⚾🎾🏐🏉👣💛💚💙💜🖤`
                    },
                    {
                        name: 'Flags',
                        emojis: '🏳️🏴🏁🚩🏳️‍🌈🇦🇫🇦🇽🇦🇱🇩🇿🇦🇸🇦🇩🇦🇴🇦🇮🇦🇶🇦🇬🇦🇷🇦🇲🇦🇼🇦🇺🇦🇹🇦🇿🇧🇸🇧🇭🇧🇩🇧🇧🇧🇾🇧🇪🇧🇿🇧🇯🇧🇲🇧🇹🇧🇴🇧🇦🇧🇼🇧🇷🇮🇴🇻🇬🇧🇳🇧🇬🇧🇫🇧🇮🇰🇭🇨🇲🇨🇦🇮🇨🇨🇻🇧🇶🇰🇾🇨🇫🇹🇩🇨🇱🇨🇳🇨🇽🇨🇨🇨🇴🇰🇲🇨🇬🇨🇩🇨🇰🇨🇷🇨🇮🇭🇷🇨🇺🇨🇼🇨🇾🇨🇿🇩🇰🇩🇯🇩🇲🇩🇴🇪🇨🇪🇬🇸🇻🇬🇶🇪🇷🇪🇪🇪🇹🇪🇺🇫🇰🇫🇴🇫🇯🇫🇮🇫🇷🇬🇫🇵🇫🇹🇫🇬🇦🇬🇲🇬🇪🇩🇪🇬🇭🇬🇮🇬🇷🇬🇱🇬🇩🇬🇵🇬🇺🇬🇹🇬🇬🇬🇳🇬🇼🇬🇾🇭🇹🇭🇳🇭🇰🇭🇺🇮🇸🇮🇳🇮🇩🇮🇷🇮🇶🇮🇪🇮🇲🇮🇱🇮🇹🇯🇲🇯🇵🎌🇯🇪🇯🇴🇰🇿🇰🇪🇰🇮🇽🇰🇰🇼🇰🇬🇱🇦🇱🇻🇱🇧🇱🇸🇱🇷🇱🇾🇱🇮🇱🇹🇱🇺🇲🇴🇲🇰🇲🇬🇲🇼🇲🇾🇲🇻🇲🇱🇲🇹🇲🇭🇲🇶🇲🇷🇲🇺🇾🇹🇲🇽🇫🇲🇲🇩🇲🇨🇲🇳🇲🇪🇲🇸🇲🇦🇲🇿🇲🇲🇳🇦🇳🇷🇳🇵🇳🇱🇳🇨🇳🇿🇳🇮🇳🇪🇳🇬🇳🇺🇳🇫🇰🇵🇲🇵🇳🇴🇴🇲🇵🇰🇵🇼🇵🇸🇵🇦🇵🇬🇵🇾🇵🇪🇵🇭🇵🇳🇵🇱🇵🇹🇵🇷🇶🇦🇷🇪🇷🇴🇷🇺🇷🇼🇼🇸🇸🇲🇸🇦🇸🇳🇷🇸🇸🇨🇸🇱🇸🇬🇸🇽🇸🇰🇸🇮🇬🇸🇸🇧🇸🇴🇿🇦🇰🇷🇸🇸🇪🇸🇱🇰🇧🇱🇸🇭🇰🇳🇱🇨🇵🇲🇻🇨🇸🇩🇸🇷🇸🇿🇸🇪🇨🇭🇸🇾🇹🇼🇹🇯🇹🇿🇹🇭🇹🇱🇹🇬🇹🇰🇹🇴🇹🇹🇹🇳🇹🇷🇹🇲🇹🇨🇹🇻🇻🇮🇺🇬🇺🇦🇦🇪🇬🇧🇺🇸🇺🇾🇺🇿🇻🇺🇻🇦🇻🇪🇻🇳🇼🇫🇪🇭🇾🇪🇿🇲🇿🇼'
                    },
                    {name: 'Sepia', emojis: `👌👌🏻👌🏼👌🏽👌🏾👌`},
                    {
                        name: 'Travel',
                        emojis: `🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🚚🚛🚜🛴🚲🛵🏍🚨🚔🚍🚘🚖🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂🚆🚇🚊🚉🚁🛩✈️🛫🛬🚀🛰💺🛶⛵️🛥🚤🛳⛴🚢⚓️🚧⛽️🚏🚦🚥🗺🗿🗽⛲️🗼🏰🏯🏟🎡🎢🎠⛱🏖🏝⛰🏔🗻🌋🏜🏕⛺️🛤🛣🏗🏭🏠🏡🏘🏚🏢🏬🏣🏤🏥🏦🏨🏪🏫🏩💒🏛⛪️🕌🕍🕋⛩🗾🎑🏞🌅🌄🌠🎇🎆🌇🌆🏙🌃🌌🌉🌁`
                    },
                    {
                        name: 'All (very slow)',
                        emojis: `😀😁😂🤣😃😄😅😆😉😊😋😎😍😘😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱😳🤪😵😡😠🤬😷🤒🤕🤢🤮🤧😇🤠🤡🤥🤫🤭🧐🤓😈👿👹👺💀👻👽🤖💩😺😸😹😻😼😽🙀😿😾👶👦👧👨👩👴👵👨‍⚕️👩‍⚕️👨‍🎓👩‍🎓👨‍⚖️👩‍⚖️👨‍🌾👩‍🌾👨‍🍳👩‍🍳👨‍🔧👩‍🔧👨‍🏭👩‍🏭👨‍💼👩‍💼👨‍🔬👩‍🔬👨‍💻👩‍💻👨‍🎤👩‍🎤👨‍🎨👩‍🎨👨‍✈️👩‍✈️👨‍🚀👩‍🚀👨‍🚒👩‍🚒👮👮‍♂️👮‍♀️🕵🕵️‍♂️🕵️‍♀️💂💂‍♂️💂‍♀️👷👷‍♂️👷‍♀️🤴👸👳👳‍♂️👳‍♀️👲🧕🧔👱👱‍♂️👱‍♀️🤵👰🤰🤱👼🎅🤶🧙‍♀️🧙‍♂️🧚‍♀️🧚‍♂️🧛‍♀️🧛‍♂️🧜‍♀️🧜‍♂️🧝‍♀️🧝‍♂️🧞‍♀️🧞‍♂️🧟‍♀️🧟‍♂️🙍🙍‍♂️🙍‍♀️🙎🙎‍♂️🙎‍♀️🙅🙅‍♂️🙅‍♀️🙆🙆‍♂️🙆‍♀️💁💁‍♂️💁‍♀️🙋🙋‍♂️🙋‍♀️🙇🙇‍♂️🙇‍♀️🤦🤦‍♂️🤦‍♀️🤷🤷‍♂️🤷‍♀️💆💆‍♂️💆‍♀️💇💇‍♂️💇‍♀️🚶🚶‍♂️🚶‍♀️🏃🏃‍♂️🏃‍♀️💃🕺👯👯‍♂️👯‍♀️🧖‍♀️🧖‍♂️🕴🗣👤👥👫👬👭💏👨‍❤️‍💋‍👨👩‍❤️‍💋‍👩💑👨‍❤️‍👨👩‍❤️‍👩👪👨‍👩‍👦👨‍👩‍👧👨‍👩‍👧‍👦👨‍👩‍👦‍👦👨‍👩‍👧‍👧👨‍👨‍👦👨‍👨‍👧👨‍👨‍👧‍👦👨‍👨‍👦‍👦👨‍👨‍👧‍👧👩‍👩‍👦👩‍👩‍👧👩‍👩‍👧‍👦👩‍👩‍👦‍👦👩‍👩‍👧‍👧👨‍👦👨‍👦‍👦👨‍👧👨‍👧‍👦👨‍👧‍👧👩‍👦👩‍👦‍👦👩‍👧👩‍👧‍👦👩‍👧‍👧🤳💪👈👉☝️👆🖕👇✌️🤞🖖🤘🖐✋👌👍👎✊👊🤛🤜🤚👋🤟✍️👏👐🙌🤲🙏🤝💅👂👃👣👀👁🧠👅👄💋👓🕶👔👕👖🧣🧤🧥🧦👗👘👙👚👛👜👝🎒👞👟👠👡👢👑👒🎩🎓🧢⛑💄💍🌂💼👐🏻🙌🏻👏🏻🙏🏻👍🏻👎🏻👊🏻✊🏻🤛🏻🤜🏻🤞🏻✌🏻🤘🏻👌🏻👈🏻👉🏻👆🏻👇🏻☝🏻✋🏻🤚🏻🖐🏻🖖🏻👋🏻🤙🏻💪🏻🖕🏻✍🏻🤳🏻💅🏻👂🏻👃🏻👶🏻👦🏻👧🏻👨🏻👩🏻👱🏻‍♀️👱🏻👴🏻👵🏻👲🏻👳🏻‍♀️👳🏻👮🏻‍♀️👮🏻👷🏻‍♀️👷🏻💂🏻‍♀️💂🏻🕵🏻‍♀️🕵🏻👩🏻‍⚕️👨🏻‍⚕️👩🏻‍🌾👨🏻‍🌾👩🏻‍🍳👨🏻‍🍳👩🏻‍🎓👨🏻‍🎓👩🏻‍🎤👨🏻‍🎤👩🏻‍🏫👨🏻‍🏫👩🏻‍🏭👨🏻‍🏭👩🏻‍💻👨🏻‍💻👩🏻‍💼👨🏻‍💼👩🏻‍🔧👨🏻‍🔧👩🏻‍🔬👨🏻‍🔬👩🏻‍🎨👨🏻‍🎨👩🏻‍🚒👨🏻‍🚒👩🏻‍✈️👨🏻‍✈️👩🏻‍🚀👨🏻‍🚀👩🏻‍⚖️👨🏻‍⚖️🤶🏻🎅🏻👸🏻🤴🏻👰🏻🤵🏻👼🏻🤰🏻🙇🏻‍♀️🙇🏻💁🏻💁🏻‍♂️🙅🏻🙅🏻‍♂️🙆🏻🙆🏻‍♂️🙋🏻🙋🏻‍♂️🤦🏻‍♀️🤦🏻‍♂️🤷🏻‍♀️🤷🏻‍♂️🙎🏻🙎🏻‍♂️🙍🏻🙍🏻‍♂️💇🏻💇🏻‍♂️💆🏻💆🏻‍♂️🕴🏻💃🏻🕺🏻🚶🏻‍♀️🚶🏻🏃🏻‍♀️🏃🏻🏋🏻‍♀️🏋🏻🤸🏻‍♀️🤸🏻‍♂️⛹🏻‍♀️⛹🏻🤾🏻‍♀️🤾🏻‍♂️🏌🏻‍♀️🏌🏻🏄🏻‍♀️🏄🏻🏊🏻‍♀️🏊🏻🤽🏻‍♀️🤽🏻‍♂️🚣🏻‍♀️🚣🏻🏇🏻🚴🏻‍♀️🚴🏻🚵🏻‍♀️🚵🏻🤹🏻‍♀️🤹🏻‍♂️🛀🏻👐🏼🙌🏼👏🏼🙏🏼👍🏼👎🏼👊🏼✊🏼🤛🏼🤜🏼🤞🏼✌🏼🤘🏼👌🏼👈🏼👉🏼👆🏼👇🏼☝🏼✋🏼🤚🏼🖐🏼🖖🏼👋🏼🤙🏼💪🏼🖕🏼✍🏼🤳🏼💅🏼👂🏼👃🏼👶🏼👦🏼👧🏼👨🏼👩🏼👱🏼‍♀️👱🏼👴🏼👵🏼👲🏼👳🏼‍♀️👳🏼👮🏼‍♀️👮🏼👷🏼‍♀️👷🏼💂🏼‍♀️💂🏼🕵🏼‍♀️🕵🏼👩🏼‍⚕️👨🏼‍⚕️👩🏼‍🌾👨🏼‍🌾👩🏼‍🍳👨🏼‍🍳👩🏼‍🎓👨🏼‍🎓👩🏼‍🎤👨🏼‍🎤👩🏼‍🏫👨🏼‍🏫👩🏼‍🏭👨🏼‍🏭👩🏼‍💻👨🏼‍💻👩🏼‍💼👨🏼‍💼👩🏼‍🔧👨🏼‍🔧👩🏼‍🔬👨🏼‍🔬👩🏼‍🎨👨🏼‍🎨👩🏼‍🚒👨🏼‍🚒👩🏼‍✈️👨🏼‍✈️👩🏼‍🚀👨🏼‍🚀👩🏼‍⚖️👨🏼‍⚖️🤶🏼🎅🏼👸🏼🤴🏼👰🏼🤵🏼👼🏼🤰🏼🙇🏼‍♀️🙇🏼💁🏼💁🏼‍♂️🙅🏼🙅🏼‍♂️🙆🏼🙆🏼‍♂️🙋🏼🙋🏼‍♂️🤦🏼‍♀️🤦🏼‍♂️🤷🏼‍♀️🤷🏼‍♂️🙎🏼🙎🏼‍♂️🙍🏼🙍🏼‍♂️💇🏼💇🏼‍♂️💆🏼💆🏼‍♂️🕴🏼💃🏼🕺🏼🚶🏼‍♀️🚶🏼🏃🏼‍♀️🏃🏼🏋🏼‍♀️🏋🏼🤸🏼‍♀️🤸🏼‍♂️⛹🏼‍♀️⛹🏼🤾🏼‍♀️🤾🏼‍♂️🏌🏼‍♀️🏌🏼🏄🏼‍♀️🏄🏼🏊🏼‍♀️🏊🏼🤽🏼‍♀️🤽🏼‍♂️🚣🏼‍♀️🚣🏼🏇🏼🚴🏼‍♀️🚴🏼🚵🏼‍♀️🚵🏻🤹🏼‍♀️🤹🏼‍♂️🛀🏼👐🏽🙌🏽👏🏽🙏🏽👍🏽👎🏽👊🏽✊🏽🤛🏽🤜🏽🤞🏽✌🏽🤘🏽👌🏽👈🏽👉🏽👆🏽👇🏽☝🏽✋🏽🤚🏽🖐🏽🖖🏽👋🏽🤙🏽💪🏽🖕🏽✍🏽🤳🏽💅🏽👂🏽👃🏽👶🏽👦🏽👧🏽👨🏽👩🏽👱🏽‍♀️👱🏽👴🏽👵🏽👲🏽👳🏽‍♀️👳🏽👮🏽‍♀️👮🏽👷🏽‍♀️👷🏽💂🏽‍♀️💂🏽🕵🏽‍♀️🕵🏽👩🏽‍⚕️👨🏽‍⚕️👩🏽‍🌾👨🏽‍🌾👩🏽‍🍳👨🏽‍🍳👩🏽‍🎓👨🏽‍🎓👩🏽‍🎤👨🏽‍🎤👩🏽‍🏫👨🏽‍🏫👩🏽‍🏭👨🏽‍🏭👩🏽‍💻👨🏽‍💻👩🏽‍💼👨🏽‍💼👩🏽‍🔧👨🏽‍🔧👩🏽‍🔬👨🏽‍🔬👩🏽‍🎨👨🏽‍🎨👩🏽‍🚒👨🏽‍🚒👩🏽‍✈️👨🏽‍✈️👩🏽‍🚀👨🏽‍🚀👩🏽‍⚖️👨🏽‍⚖️🤶🏽🎅🏽👸🏽🤴🏽👰🏽🤵🏽👼🏽🤰🏽🙇🏽‍♀️🙇🏽💁🏽💁🏽‍♂️🙅🏽🙅🏽‍♂️🙆🏽🙆🏽‍♂️🙋🏽🙋🏽‍♂️🤦🏽‍♀️🤦🏽‍♂️🤷🏽‍♀️🤷🏽‍♂️🙎🏽🙎🏽‍♂️🙍🏽🙍🏽‍♂️💇🏽💇🏽‍♂️💆🏽💆🏽‍♂️🕴🏼💃🏽🕺🏽🚶🏽‍♀️🚶🏽🏃🏽‍♀️🏃🏽🏋🏽‍♀️🏋🏽🤸🏽‍♀️🤸🏽‍♂️⛹🏽‍♀️⛹🏽🤾🏽‍♀️🤾🏽‍♂️🏌🏽‍♀️🏌🏽🏄🏽‍♀️🏄🏽🏊🏽‍♀️🏊🏽🤽🏽‍♀️🤽🏽‍♂️🚣🏽‍♀️🚣🏽🏇🏽🚴🏽‍♀️🚴🏽🚵🏽‍♀️🚵🏽🤹🏽‍♀️🤹🏽‍♂️🛀🏽👐🏾🙌🏾👏🏾🙏🏾👍🏾👎🏾👊🏾✊🏾🤛🏾🤜🏾🤞🏾✌🏾🤘🏾👌🏾👈🏾👉🏾👆🏾👇🏾☝🏾✋🏾🤚🏾🖐🏾🖖🏾👋🏾🤙🏾💪🏾🖕🏾✍🏾🤳🏾💅🏾👂🏾👃🏾👶🏾👦🏾👧🏾👨🏾👩🏾👱🏾‍♀️👱🏾👴🏾👵🏾👲🏾👳🏾‍♀️👳🏾👮🏾‍♀️👮🏾👷🏾‍♀️👷🏾💂🏾‍♀️💂🏾🕵🏾‍♀️🕵🏾👩🏾‍⚕️👨🏾‍⚕️👩🏾‍🌾👨🏾‍🌾👩🏾‍🍳👨🏾‍🍳👩🏾‍🎓👨🏾‍🎓👩🏾‍🎤👨🏾‍🎤👩🏾‍🏫👨🏾‍🏫👩🏾‍🏭👨🏾‍🏭👩🏾‍💻👨🏾‍💻👩🏾‍💼👨🏾‍💼👩🏾‍🔧👨🏾‍🔧👩🏾‍🔬👨🏾‍🔬👩🏾‍🎨👨🏾‍🎨👩🏾‍🚒👨🏾‍🚒👩🏾‍✈️👨🏾‍✈️👩🏾‍🚀👨🏾‍🚀👩🏾‍⚖️👨🏾‍⚖️🤶🏾🎅🏾👸🏾🤴🏾👰🏾🤵🏾👼🏾🤰🏾🙇🏾‍♀️🙇🏾💁🏾💁🏾‍♂️🙅🏾🙅🏾‍♂️🙆🏾🙆🏾‍♂️🙋🏾🙋🏾‍♂️🤦🏾‍♀️🤦🏾‍♂️🤷🏾‍♀️🤷🏾‍♂️🙎🏾🙎🏾‍♂️🙍🏾🙍🏾‍♂️💇🏾💇🏾‍♂️💆🏾💆🏾‍♂️🕴🏾💃🏾🕺🏾🚶🏾‍♀️🚶🏾🏃🏾‍♀️🏃🏾🏋🏾‍♀️🏋🏾🤸🏾‍♀️🤸🏾‍♂️⛹🏾‍♀️⛹🏾🤾🏾‍♀️🤾🏾‍♂️🏌🏾‍♀️🏌🏾🏄🏾‍♀️🏄🏾🏊🏾‍♀️🏊🏾🤽🏾‍♀️🤽🏾‍♂️🚣🏾‍♀️🚣🏾🏇🏾🚴🏾‍♀️🚴🏾🚵🏾‍♀️🚵🏾🤹🏾‍♀️🤹🏾‍♂️🛀🏾👐🏿🙌🏿👏🏿🙏🏿👍🏿👎🏿👊🏿✊🏿🤛🏿🤜🏿🤞🏿✌🏿🤘🏿👌🏿👈🏿👉🏿👆🏿👇🏿☝🏿✋🏿🤚🏿🖐🏿🖖🏿👋🏿🤙🏿💪🏿🖕🏿✍🏿🤳🏿💅🏿👂🏿👃🏿👶🏿👦🏿👧🏿👨🏿👩🏿👱🏿‍♀️👱🏿👴🏿👵🏿👲🏿👳🏿‍♀️👳🏿👮🏿‍♀️👮🏿👷🏿‍♀️👷🏿💂🏿‍♀️💂🏿🕵🏿‍♀️🕵🏿👩🏿‍⚕️👨🏿‍⚕️👩🏿‍🌾👨🏿‍🌾👩🏿‍🍳👨🏿‍🍳👩🏿‍🎓👨🏿‍🎓👩🏿‍🎤👨🏿‍🎤👩🏿‍🏫👨🏿‍🏫👩🏿‍🏭👨🏿‍🏭👩🏿‍💻👨🏿‍💻👩🏿‍💼👨🏿‍💼👩🏿‍🔧👨🏿‍🔧👩🏿‍🔬👨🏿‍🔬👩🏿‍🎨👨🏿‍🎨👩🏿‍🚒👨🏿‍🚒👩🏿‍✈️👨🏿‍✈️👩🏿‍🚀👨🏿‍🚀👩🏿‍⚖️👨🏿‍⚖️🤶🏿🎅🏿👸🏿🤴🏿👰🏿🤵🏿👼🏿🤰🏿🙇🏿‍♀️🙇🏿💁🏿💁🏿‍♂️🙅🏿🙅🏿‍♂️🙆🏿🙆🏿‍♂️🙋🏿🙋🏿‍♂️🤦🏿‍♀️🤦🏿‍♂️🤷🏿‍♀️🤷🏿‍♂️🙎🏿🙎🏿‍♂️🙍🏿🙍🏿‍♂️💇🏿💇🏿‍♂️💆🏿💆🏿‍♂️🕴🏿💃🏿🕺🏿🚶🏿‍♀️🚶🏿🏃🏿‍♀️🏃🏿🏋🏿‍♀️🏋🏿🤸🏿‍♀️🤸🏿‍♂️⛹🏿‍♀️⛹🏿🤾🏿‍♀️🤾🏿‍♂️🏌🏿‍♀️🏌🏿🏄🏿‍♀️🏄🏿🏊🏿‍♀️🏊🏿🤽🏿‍♀️🤽🏿‍♂️🚣🏿‍♀️🚣🏿🏇🏿🚴🏿‍♀️🚴🏿🚵🏿‍♀️🚵🏿🤹🏿‍♀️🤹🏿‍♂️🛀🏿🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐽🐸🐵🙊🙉🙊🐒🐔🐧🐦🐤🐣🐥🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐚🐞🐜🕷🕸🐢🐍🦎🦂🦀🦑🐙🦐🐠🐟🐡🐬🦈🐳🐋🐊🐆🐅🐃🐂🐄🦌🐪🐫🐘🦏🦍🐎🐖🐐🐏🐑🐕🐩🐈🐓🦃🕊🐇🐁🐀🐿🐾🐉🐲🌵🎄🌲🌳🌴🌱🌿☘️🍀🎍🎋🍃🍂🍁🍄🌾💐🌷🌹🥀🌻🌼🌸🌺🌎🌍🌏🌕🌖🌗🌘🌑🌒🌓🌔🌚🌝🌞🌛🌜🌙💫⭐️🌟✨⚡️🔥💥☄️☀️🌤⛅️🌥🌦🌈☁️🌧⛈🌩🌨☃️⛄️❄️🌬💨🌪🌫🌊💧💦☔️🍏🍎🍐🍊🍋🍌🍉🍇🍓🍈🍒🍑🍍🥝🥑🍅🍆🥒🥕🌽🌶🥔🍠🌰🥜🍯🥐🍞🥖🧀🥚🍳🥓🥞🍤🍗🍖🍕🌭🍔🍟🥙🌮🌯🥗🥘🍝🍜🍲🍥🍣🍱🍛🍚🍙🍘🍢🍡🍧🍨🍦🍰🎂🍮🍭🍬🍫🍿🍩🍪🥛🍼☕️🍵🍶🍺🍻🥂🍷🥃🍸🍹🍾🥄🍴🍽⚽️🏀🏈⚾️🎾🏐🏉🎱🏓🏸🥅🏒🏑🏏⛳️🏹🎣🥊🥋⛸🎿⛷🏂🏋️‍♀️🏋️🤺🤼‍♀️🤼‍♂️🤸‍♀️🤸‍♂️⛹️‍♀️⛹️🤾‍♀️🤾‍♂️🏌️‍♀️🏌️🏄‍♀️🏄🏊‍♀️🏊🤽‍♀️🤽‍♂️🚣‍♀️🚣🏇🚴‍♀️🚴🚵‍♀️🚵🎽🏅🎖🥇🥈🥉🏆🏵🎗🎫🎟🎪🤹‍♀️🤹‍♂️🎭🎨🎬🎤🎧🎼🎹🥁🎷🎺🎸🎻🎲🎯🎳🎮🎰🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🚚🚛🚜🛴🚲🛵🏍🚨🚔🚍🚘🚖🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂🚆🚇🚊🚉🚁🛩✈️🛫🛬🚀🛰💺🛶⛵️🛥🚤🛳⛴🚢⚓️🚧⛽️🚏🚦🚥🗺🗿🗽⛲️🗼🏰🏯🏟🎡🎢🎠⛱🏖🏝⛰🏔🗻🌋🏜🏕⛺️🛤🛣🏗🏭🏠🏡🏘🏚🏢🏬🏣🏤🏥🏦🏨🏪🏫🏩💒🏛⛪️🕌🕍🕋⛩🗾🎑🏞🌅🌄🌠🎇🎆🌇🌆🏙🌃🌌🌉🌁⌚️📱📲💻⌨️🖥🖨🖱🖲🕹🗜💽💾💿📀📼📷📸📹🎥📽🎞📞☎️📟📠📺📻🎙🎚🎛⏱⏲⏰🕰⌛️⏳📡🔋🔌💡🔦🕯🗑🛢💸💵💴💶💷💰💳💎⚖️🔧🔨⚒🛠⛏🔩⚙️⛓🔫💣🔪🗡⚔️🛡🚬⚰️⚱️🏺🔮📿💈⚗️🔭🔬🕳💊💉🌡🚽🚰🚿🛁🛀🛎🔑🗝🚪🛋🛏🛌🖼🛍🛒🎁🎈🎏🎀🎊🎉🎎🏮🎐✉️📩📨📧💌📥📤📦🏷📪📫📬📭📮📯📜📃📄📑📊📈📉🗒🗓📆📅📇🗃🗳🗄📋📁📂🗂🗞📰📓📔📒📕📗📘📙📚📖🔖🔗📎🖇📐📏📌📍📌🎌🏳️🏴🏁🏳️‍🌈✂️🖊🖋✒️🖌🖍📝✏️🔍🔎🔏🔐🔒🔓❤️💛💚💙💜🖤💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉☸️✡️🔯🕎☯️☦️🛐⛎♈️♉️♊️♋️♌️♍️♎️♏️♐️♑️♒️♓️🆔⚛️🉑☢️☣️📴📳🈶🈚️🈸🈺🈷️✴️🆚💮🉐㊙️㊗️🈴🈵🈹🈲🅰️🅱️🆎🆑🅾️🆘❌⭕️🛑⛔️📛🚫💯💢♨️🚷🚯🚳🚱🔞📵🚭❗️❕❓❔‼️⁉️🔅🔆〽️⚠️🚸🔱⚜️🔰♻️✅🈯️💹❇️✳️❎🌐💠Ⓜ️🌀💤🏧🚾♿️🅿️🈳🈂️🛂🛃🛄🛅🚹🚺🚼🚻🚮🎦📶🈁🔣ℹ️🔤🔡🔠🆖🆗🆙🆒🆕🆓0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟🔢#️⃣*️⃣▶️⏸⏯⏹⏺⏭⏮⏩⏪⏫⏬◀️🔼🔽➡️⬅️⬆️⬇️↗️↘️↙️↖️↕️↔️↪️↩️⤴️⤵️🔀🔁🔂🔄🔃🎵🎶➕➖➗✖️💲💱™️©️®️〰️➰➿🔚🔙🔛🔝✔️☑️🔘⚪️⚫️🔴🔵🔺🔻🔸🔹🔶🔷🔳🔲▪️▫️◾️◽️◼️◻️⬛️⬜️🔈🔇🔉🔊🔔🔕📣📢👁‍🗨💬💭🗯♠️♣️♥️♦️🃏🎴🀄️🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧🏳️🏴🏁🚩🏳️‍🌈🇦🇫🇦🇽🇦🇱🇩🇿🇦🇸🇦🇩🇦🇴🇦🇮🇦🇶🇦🇬🇦🇷🇦🇲🇦🇼🇦🇺🇦🇹🇦🇿🇧🇸🇧🇭🇧🇩🇧🇧🇧🇾🇧🇪🇧🇿🇧🇯🇧🇲🇧🇹🇧🇴🇧🇦🇧🇼🇧🇷🇮🇴🇻🇬🇧🇳🇧🇬🇧🇫🇧🇮🇰🇭🇨🇲🇨🇦🇮🇨🇨🇻🇧🇶🇰🇾🇨🇫🇹🇩🇨🇱🇨🇳🇨🇽🇨🇨🇨🇴🇰🇲🇨🇬🇨🇩🇨🇰🇨🇷🇨🇮🇭🇷🇨🇺🇨🇼🇨🇾🇨🇿🇩🇰🇩🇯🇩🇲🇩🇴🇪🇨🇪🇬🇸🇻🇬🇶🇪🇷🇪🇪🇪🇹🇪🇺🇫🇰🇫🇴🇫🇯🇫🇮🇫🇷🇬🇫🇵🇫🇹🇫🇬🇦🇬🇲🇬🇪🇩🇪🇬🇭🇬🇮🇬🇷🇬🇱🇬🇩🇬🇵🇬🇺🇬🇹🇬🇬🇬🇳🇬🇼🇬🇾🇭🇹🇭🇳🇭🇰🇭🇺🇮🇸🇮🇳🇮🇩🇮🇷🇮🇶🇮🇪🇮🇲🇮🇱🇮🇹🇯🇲🇯🇵🎌🇯🇪🇯🇴🇰🇿🇰🇪🇰🇮🇽🇰🇰🇼🇰🇬🇱🇦🇱🇻🇱🇧🇱🇸🇱🇷🇱🇾🇱🇮🇱🇹🇱🇺🇲🇴🇲🇰🇲🇬🇲🇼🇲🇾🇲🇻🇲🇱🇲🇹🇲🇭🇲🇶🇲🇷🇲🇺🇾🇹🇲🇽🇫🇲🇲🇩🇲🇨🇲🇳🇲🇪🇲🇸🇲🇦🇲🇿🇲🇲🇳🇦🇳🇷🇳🇵🇳🇱🇳🇨🇳🇿🇳🇮🇳🇪🇳🇬🇳🇺🇳🇫🇰🇵🇲🇵🇳🇴🇴🇲🇵🇰🇵🇼🇵🇸🇵🇦🇵🇬🇵🇾🇵🇪🇵🇭🇵🇳🇵🇱🇵🇹🇵🇷🇶🇦🇷🇪🇷🇴🇷🇺🇷🇼🇼🇸🇸🇲🇸🇦🇸🇳🇷🇸🇸🇨🇸🇱🇸🇬🇸🇽🇸🇰🇸🇮🇬🇸🇸🇧🇸🇴🇿🇦🇰🇷🇸🇸🇪🇸🇱🇰🇧🇱🇸🇭🇰🇳🇱🇨🇵🇲🇻🇨🇸🇩🇸🇷🇸🇿🇸🇪🇨🇭🇸🇾🇹🇼🇹🇯🇹🇿🇹🇭🇹🇱🇹🇬🇹🇰🇹🇴🇹🇹🇹🇳🇹🇷🇹🇲🇹🇨🇹🇻🇻🇮🇺🇬🇺🇦🇦🇪🇬🇧🇺🇸🇺🇾🇺🇿🇻🇺🇻🇦🇻🇪🇻🇳🇼🇫🇪🇭🇾🇪🇿🇲🇿🇼😃💁People•🐻🌻Animals•🍔🍹Food•🎷⚽️Activities•🚘🌇Travel•💡🎉Objects•💖🔣Symbols•🎌🏳️‍🌈Flags🤩🤨🤯🤪🤬🤮🤫🤭🧐🧒🧑🧓🧕🧔🤱🧙🧙‍♀️🧙‍♂️🧚🧚‍♀️🧚‍♂️🧛🧛‍♀️🧛‍♂️🧜🧜‍♀️🧜‍♂️🧝🧝‍♀️🧝‍♂️🧞🧞‍♀️🧞‍♂️🧟🧟‍♀️🧟‍♂️🧖🧖‍♀️🧖‍♂️🧗🧗‍♀️🧗‍♂️🧘🧘‍♀️🧘‍♂️🤟🤲🧠🧡🧣🧤🧥🧦🧢🦓🦒🦔🦕🦖🦗🥥🥦🥨🥩🥪🥣🥫🥟🥠🥡🥧🥤🥢🛸🛷🥌🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿😃💁People•🐻🌻Animals•🍔🍹Food•🎷⚽️Activities•🚘🌇Travel•💡🎉Objects•💖🔣Symbols•🎌🏳️‍🌈Flags☺️☹☝️✌️✍️❤️❣️☠♨️✈️⌛⌚♈♉♊♋♌♍♎♏♐♑♒♓☀️☁️☂️❄️⛄️☄♠️♥️♦️♣️▶️◀️☎️⌨✉️✏️✒️✂️↗️➡️↘️↙️↖️↕️↔️↩️↪️✡️☸☯️✝️☦☪☮☢☣☑️✔️✖️✳️✴️❇️‼️©️®️™️Ⓜ️▪️▫️#⃣️*️⃣0⃣️1⃣️2⃣️3⃣️4⃣️5⃣️6⃣️7⃣️8⃣️9⃣️⁉️ℹ️⤴️⤵️♻️◻️◼️◽◾☕⚠️☔⏏⬆️⬇️⬅️⚡☘⚓♿⚒⚙⚗⚖⚔⚰⚱⚜⚛⚪⚫🀄⭐⬛⬜⛑⛰⛪⛲⛺⛽⛵⛴⛔⛅⛈⛱⛄⚽⚾️⛳⛸⛷⛹⛏⛓⛩⭕❗🅿️❦♕♛♔♖♜☾→⇒⟹⇨⇰➩➪➫➬➭➮➯➲➳➵➸➻➺➼➽☜☟➹➷↶↷✆⌘⎋⏎⏏⎈⎌⍟❥ツღ☻`
                    },
                ],
                emojiPalette: ``,
                spriteCache: {},
                emojiWidth: 20,
                emojiMap: null,
                grid: null,
                windowHeight: innerHeight,
                frontFacing: true,
                animationRequest: false,
            }
        },
        async mounted() {
            this.cameraDevices = await this.getCameraList();
            // Video output
            this.video = document.createElement('video');
            this.video.setAttribute('autoplay', '');
            this.canvas = document.querySelector('.render-output');
            this.context = this.canvas.getContext('2d');

            // Emoji output
            if (localStorage.getItem('lastPalette') !== null)
                this.emojiPalette = localStorage.lastPalette;
            else
                this.emojiPalette = this.paletteOptions[0].emojis;

            this.renderView = new PIXI.Application({transparent: true});
            this.renderView.renderer.resize(0, 0);
            console.log(this.renderView);
            document.querySelector('.emoji-output').appendChild(this.renderView.view);

            window.addEventListener('resize', () => this.windowUpdate());
            this.windowUpdate();

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                await this.changeCamera();
            }

        },
        methods: {
            async changeCamera() {
                if (this.animationRequest !== false)
                    cancelAnimationFrame(this.animationRequest);

                let frontFacing = {facingMode: "user"};
                let rearFacing = {facingMode: {exact: "environment"}};

                this.video.srcObject = await navigator.mediaDevices.getUserMedia({video: this.frontFacing ? frontFacing : rearFacing});
                this.video.play();
                this.video.oncanplay = () => {
                    this.updateSettings();
                    this.animationRequest = requestAnimationFrame(() => this.renderEmoji());
                }
            },
            async getCameraList() {
                let devices = await navigator.mediaDevices.enumerateDevices();
                return devices.filter(d => d.kind === 'videoinput');
            },
            updateSettings() {
                this.updatePalette();
                this.emojiWidth = +this.emojiWidth;
                let emojiHeight = Math.floor(this.emojiWidth / (innerWidth / this.windowHeight));
                console.log("UPADTE SETTINGS", this.emojiWidth, 'ratio', innerWidth / this.windowHeight, 'height', emojiHeight);
                this.grid = this.createEmojiGrid(this.emojiWidth, emojiHeight);
                this.windowUpdate();
            },

            downloadPicture() {
                let renderer = this.renderView.renderer;

                let fileName = new Date().toLocaleString() + '.png';
                const renderTexture = PIXI.RenderTexture.create(renderer.width, renderer.height);
                renderer.render(this.renderView.stage, renderTexture);﻿
                const canvas = renderer.extract.canvas(renderTexture);
                let url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                document.body.append(a);
                a.download = fileName;
                a.href = url;
                a.click();
                a.remove();
                this.showSnackbar = true;
            },

            renderEmoji() {
                requestAnimationFrame(() => this.renderEmoji());
                let now = performance.now();

                this.context.drawImage(this.video, ...this.videoCrop, 0, 0, this.canvas.width, this.canvas.height);
                let imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
                this.pictureToEmoji(this.grid, imageData);
                this.renderEmojiGrid(this.grid);

                let frameTime = performance.now() - now;
                // console.log({frameTime});
            },

            updatePalette() {
                if (this.emojiMap === null || this.emojiMap.palette !== this.emojiPalette) {
                    this.emojiMap = EmojiMapManager.emojiMap(this.emojiPalette);
                    this.updateEmojiTextureMap();
                }
            },

            updateEmojiTextureMap() {
                console.log("Updating emoji texture map");
                const emojiSize = innerWidth / this.emojiWidth;
                for (let emoji of EmojiSplitter.spliddit(this.emojiPalette)) {
                    let text = new PIXI.Text(emoji, {fontSize: emojiSize, fill: '#ffffff'});
                    text.updateText(); // force it to render to texture inside

                    this.spriteCache[emoji] = text.texture;
                }
            },

            renderEmojiGrid(emojiGrid) {
                const emojiSize = innerWidth / this.emojiWidth;

                // Clear stage
                while (this.renderView.stage.children[0])
                    this.renderView.stage.removeChild(this.renderView.stage.children[0]);

                for (let y = 0; y < emojiGrid.height; y++) {
                    for (let x = 0; x < emojiGrid.width; x++) {
                        let emoji = emojiGrid.grid[y][x];
                        let sprite = new PIXI.Sprite(this.spriteCache[emoji]);
                        sprite.x = x * emojiSize;
                        sprite.y = y * emojiSize;

                        this.renderView.stage.addChild(sprite);
                    }
                }
            },

            createEmojiGrid(width, height) {
                let grid = [];
                for (let y = 0; y < height; y++)
                    grid.push([]);
                return {width, height, grid};
            },

            pictureToEmoji(emojiGrid, imageData) {
                for (let i = 0; i < imageData.length; i += 4) {
                    let n = i / 4;
                    let y = Math.floor(n / emojiGrid.width);
                    let x = n % emojiGrid.width;

                    let [r, g, b] = imageData.slice(i, i + 3);
                    let lab = LabConvert.rgbToLab(r, g, b);
                    for (let j = 0; j < lab.length; j++) {
                        lab[j] = Math.round(
                            (this.emojiMap.colorToEmoji.colorRange + lab[j]) /
                            this.emojiMap.colorToEmoji.step)
                    }
                    emojiGrid.grid[y][x] = this.emojiMap.colorToEmoji.map[lab[0]][lab[1]][lab[2]];
                }
            },

            windowUpdate() {
                if (!this.grid) return;
                console.log("WINDOW UPDASTEW", this.grid);
                this.renderView.renderer.resize(innerWidth, this.windowHeight);
                this.updateEmojiTextureMap();

                this.video.setAttribute('width', this.video.videoWidth);
                this.video.setAttribute('height', this.video.videoHeight);
                this.canvas.width = this.grid.width;
                this.canvas.height = this.grid.height;

                let {videoWidth, videoHeight} = this.video;
                let windowRatio = innerWidth / this.windowHeight;
                let videoRatio = videoWidth / videoHeight;
                let x, y, width, height;
                if (videoRatio > windowRatio) {
                    // Video is wider than window, so crop sides
                    width = videoHeight * windowRatio;
                    height = videoHeight;
                    x = (videoWidth - width) / 2;
                    y = 0;
                } else {
                    // Window is wider than video, so crop top and bottom
                    width = videoWidth;
                    height = videoWidth / windowRatio;
                    x = 0;
                    y = (videoHeight - height) / 2;
                }
                this.videoCrop = [x, y, width, height];
            }
        },
        watch: {
            emojiPalette() {
                localStorage.lastPalette = this.emojiPalette;
            }
        }
    }
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        font-size: 50px;
    }

    .camera-button {
        position: fixed !important;
        bottom: 60px;
        left: calc(50% - 20px);
        transform: scale(1.7);
    }

    .change-button {
        position: fixed !important;
        bottom: 60px;
        left: 10px;
    }

    .settings-button {
        position: fixed !important;
        bottom: 60px;
        right: 10px;
    }

    .md-content {
        width: 100%;
        height: 100%;
        position: absolute;
    }

    .emoji-output, .render-output {
        position: fixed;
        width: 100%;
        height: 100% !important;
        top: 0;
        left: 0;
    }

    .camera-output {
        display: none;
    }

    .snackbar {
        z-index: 8 !important;
    }
</style>
