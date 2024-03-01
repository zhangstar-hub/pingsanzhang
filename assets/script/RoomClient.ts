import { _decorator, AssetManager, assetManager, view, Component, director, Label, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, Texture2D, NodeEventType, EventTouch, Button, UITransform } from 'cc';
import { EventCenter } from './event/EventCenter';
import { GameEvent } from './event/GameEvent';
import { CNet } from './network/Network';
import { PokerFactory } from './component/PokerFactory';
import { Poker } from './component/Poker';
const { ccclass, property } = _decorator;


interface Player {
    id?: number;
    name?: string;
    coin?: number;
    avatar?: string;
    desk_id?: number;
    call_score?: number;
    role?: number;
    card_num?: number;
    is_ready?: boolean;
};


@ccclass('RoomClient')
export class RoomClient extends Component {

    @property({group: {name: 'user_0'}, type: Sprite})
    public user_0_avatar: Sprite = null!;
    @property({group: {name: 'user_0'}, type: Label})
    public user_0_name: Label = null!;
    @property({group: {name: 'user_0'}, type: Label})
    public user_0_coin: Label = null!;
    @property({group: {name: 'user_0'}, type: Node})
    ReadyBtn_0: Node = null!;
    @property({group: {name: 'user_0'}, type: Label})
    ReadyBtnText_0: Label = null!;
    @property({group: {name: 'user_0'}, type: Label})
    CallScoreText_0: Label = null!;
    @property({group: {name: 'user_0'}, type: Node})
    Arrow_0: Node = null!;
    @property({group: {name: 'user_0'}, type: Node})
    PokerArea_0: Node = null!;

    @property({group: {name: 'user_1'}, type: Sprite})
    user_1_avatar: Sprite = null!;
    @property({group: {name: 'user_1'}, type: Label})
    user_1_name: Label = null!;
    @property({group: {name: 'user_1'}, type: Label})
    user_1_coin: Label = null!;
    @property({group: {name: 'user_1'}, type: Node})
    ReadyBtn_1: Node = null!;
    @property({group: {name: 'user_1'}, type: Label})
    ReadyBtnText_1: Label = null!;
    @property({group: {name: 'user_1'}, type: Label})
    CallScoreText_1: Label = null!;
    @property({group: {name: 'user_1'}, type: Node})
    Arrow_1: Node = null!;
    @property({group: {name: 'user_1'}, type: Node})
    PokerArea_1: Node = null!;

    @property({group: {name: 'user_2'}, type: Sprite})
    user_2_avatar: Sprite = null!;
    @property({group: {name: 'user_2'}, type: Label})
    user_2_name: Label = null!;
    @property({group: {name: 'user_2'}, type: Label})
    user_2_coin: Label = null!;
    @property({group: {name: 'user_2'}, type: Node})
    ReadyBtn_2: Node = null!;
    @property({group: {name: 'user_2'}, type: Label})
    ReadyBtnText_2: Label = null!;
    @property({group: {name: 'user_2'}, type: Label})
    CallScoreText_2: Label = null!;
    @property({group: {name: 'user_2'}, type: Node})
    Arrow_2: Node = null!;
    @property({group: {name: 'user_2'}, type: Node})
    PokerArea_2: Node = null!;

    // 叫分按钮 1-3分
    @property(Node)
    CallScoreBtn_1: Node = null!;
    @property(Node)
    CallScoreBtn_2: Node = null!;
    @property(Node)
    CallScoreBtn_3: Node = null!;

    // 出牌按钮
    @property(Node)
    PlayPoker: Node = null!;
    // 不出牌按钮
    @property(Node)
    NoPlayPoker: Node = null!;
    // 公共出牌区域
    @property(Node)
    PublicPokerArea: Node = null!;

    room_id: number = 0;    // 房间ID
    game_status: number = 0;    // 游戏状态 0：准备 1：叫份 2：进行
    score: number = 0;  // 分数
    call_desk: number = 0;  // 出手的座位号
    
    my_cards = [];  // 我的卡片
    played_cards = []; // 我的出牌
    my_player: Player = null;  // 我的信息
    players: Player[] = []; // 全部玩家信息

    private play_cards_lock: boolean = false;
    private default_player: Player = {
        coin: 0,
        name: '',
        avatar: '0',
    };

    private gameGundle: AssetManager.Bundle = null!;
    private pokerAtlas: SpriteAtlas = null!;
    private pokerViewPrefab: Prefab = null!;
    private pokerBackSp: SpriteFrame = null!;

    public onLoad(): void {
        assetManager.loadBundle('resources', (error, bundle: AssetManager.Bundle) => { 
            this.gameGundle = bundle;
            this.gameGundle.load("/img/back/spriteFrame", SpriteFrame, (err, pokerBackSp: SpriteFrame) => {
                console.log("pokerBackSp", pokerBackSp);
                this.pokerBackSp = pokerBackSp;
                this.onLoadPokerAtlas();
            })
        });
    }

    private onLoadPokerAtlas(): void { 
        this.gameGundle.load("img/poker", SpriteAtlas, (err, altas: SpriteAtlas) => { 
            this.pokerAtlas = altas;
            this.onLoadPokerPrefab();
        });
    }

    private onLoadPokerPrefab() { 
        this.gameGundle.load("prefabs/PokerView", Prefab, (err, prefab: Prefab) => { 
            this.pokerViewPrefab = prefab;
            this.enterGame();
        });
    }

    private enterGame() {
        EventCenter.on(GameEvent.ReqEnterRoom, this.ReqEnterRoom, this);
        EventCenter.on(GameEvent.ReqLeaveRoom, this.ReqLeaveRoom, this);
        EventCenter.on(GameEvent.ReqRoomReady, this.ReqRoomReady, this);
        EventCenter.on(GameEvent.ReqCallScore, this.ReqCallScore, this);
        EventCenter.on(GameEvent.ReqWatchCards, this.ReqWatchCards, this);
        EventCenter.on(GameEvent.ReqPlayCards, this.ReqPlayCards, this);
        EventCenter.on(GameEvent.ReqEnterRoomUpdate, this.ReqEnterRoomUpdate, this);
        EventCenter.on(GameEvent.ReqLeaveRoomUpdate, this.ReqLeaveRoomUpdate, this);
        EventCenter.on(GameEvent.ReqRoomReadyUpdate, this.ReqRoomReadyUpdate, this);
        EventCenter.on(GameEvent.ReqCallScoreUpdate, this.ReqCallScoreUpdate, this);
        EventCenter.on(GameEvent.ReqPlayCardsUpdate, this.ReqPlayCardsUpdate, this);
        CNet.send({
            cmd: 'ReqEnterRoom',
            data: {}
        })
    }

    // 回到房间事件
    public onClickBackHall() {
        CNet.send({
            cmd: 'ReqLeaveRoom',
            data: {}
        })
    }

    // 准备
    public onClickReady() {
        this.my_player.is_ready = !this.my_player.is_ready;
        console.log(this.my_player);
        CNet.send({
            cmd: 'ReqRoomReady',
            data: {
                'is_ready': this.my_player.is_ready,
            }
        })
    }

    // 叫分
    public onClickCallScore(event:Event,custom:string) {
        CNet.send({
            cmd: 'ReqCallScore',
            data: {
                'score': parseInt(custom),
            }
        })
    }

    // 出牌
    public onClickPlayPoker(event:Event) {
        console.log('play_cards_lock', this.play_cards_lock);
        if (this.play_cards_lock) {
            return
        }
        const played_cards = [];
        this.play_cards_lock = true;
        
        this.PokerArea_0.children.forEach((node: Node) => {
            const poker = node.getComponent(Poker);
            if (poker.selected) {
                played_cards.push(poker.PokerValue());
            }
        });
        CNet.send({
            cmd: 'ReqPlayCards',
            data: {
                'cards': played_cards,
            }
        })
    }

    // 不出牌
    public onClickNoPlayPoker(event:Event) {
        if (this.play_cards_lock) {
            return
        }
        this.play_cards_lock = true;
        CNet.send({
            cmd: 'ReqPlayCards',
            data: {
                'cards': [],
            }
        })
    }

    // 进入房间
    public ReqEnterRoom(data: {[key:string]:any}): void {
        const room_data = data.room;
        
        this.room_id = room_data.room_id;
        this.game_status = room_data.game_status;
        this.score = room_data.score;
        this.call_desk = room_data.call_desk;
        this.my_cards = room_data.cards;
        this.played_cards = room_data.played_cards;

        let index = 0;
        for (var i = 0; i < room_data.players.length; i++) {
            if (room_data.players[i].id === globalThis.UserInfo.id) {
                index = i;
                break;
            }
        }
        this.players.push(...room_data.players.slice(index, room_data.players.length));
        this.players.push(...room_data.players.slice(0, index));
        this.my_player = this.players[index];
        
        this.players.forEach((v)=>{
            if (v.id) {
                this.renderPlayer(v)
            }
        })
        this.showReadyBtn();
        this.showCallScore();
        this.showArrow();
        this.showPlayCardBtn();
        this.renderPublicCards(this.played_cards);
    }

    // 离开房间
    public ReqLeaveRoom(data: {[key:string]:any}) {
        director.loadScene("HallScence");
    }

    // 准备
    public ReqRoomReady(data: {[key:string]:any}) {
        if (data.error) {
            console.error("Error: " + data.error);
            return
        }
        this.game_status = data.game_status;
        this.call_desk = data.call_desk;
        if (this.my_player.is_ready) {
            this.ReadyBtnText_0.string = "已准备";
        }else {
            this.ReadyBtnText_0.string = "未准备";
        }
        this.showReadyBtn();
        this.showCallScore();
        this.showArrow();
    }

    // 叫分
    public ReqCallScore(data: {[key:string]:any}) {
        if (data.error) {
            return
        }
        this.game_status = data.game_status;
        this.call_desk = data.call_desk;
        if (this.game_status == 2) {
            CNet.send({
                cmd: 'ReqWatchCards',
                data: {}
            })
        }
        this.showCallScore();
        this.showArrow();
        this.showPlayCardBtn();
    }

    // 看牌
    public ReqWatchCards(data: {[key:string]:any}) {
        if (data.error) {
            return
        }
        console.log(data);
        this.game_status = data.game_status;
        this.my_cards = data.cards;
        this.players.forEach((val, idx)=>{
            for (const v of data.players_cards_num) {
                if (v.id == val.id) {
                    val.card_num = v.card_num;
                    break;
                }
            }
            if (idx == 0) {
                this.renderHoldCards(idx, this.my_cards)
            }else {
                this.renderHoldCards(idx, Array(val.card_num).fill(101))
            }
        })
        this.showArrow();
    }

    // 出牌
    public ReqPlayCards(data: {[key:string]:any}) {
        console.log(data);
        this.play_cards_lock = false;
        if (data.error) {
            return
        }
        this.game_status = data.game_status;
        this.my_cards = data.cards;
        this.call_desk = data.call_desk;
        this.played_cards = data.played_cards;
        this.PokerArea_0.removeAllChildren();
        this.renderHoldCards(0, this.my_cards);
        this.renderPublicCards(this.played_cards);
        this.showArrow();
    }

    // 其他人进入房间 更新信息
    public ReqEnterRoomUpdate(data: {[key:string]:any}): void {
        const message = data.message;
        const position: number = this.getPosition(message.desk_id);
        this.players[position] = data.message;
        this.renderPlayer(this.players[position]);
    }

    // 其他人离开房间 更新信息
    public ReqLeaveRoomUpdate(data: {[key:string]:any}): void {
        const from_uid = data.from_uid;
        for (var i = 0; i < this.players.length; i++) {
            if (from_uid == this.players[i].id) {
                this.renderPlayer({...this.default_player, desk_id: this.players[i].desk_id});
                this.players[i] = {};
                break;
            }
        }
    }

    // 其他人准备 更新信息
    public ReqRoomReadyUpdate(data: {[key:string]:any}): void {
        const from_uid = data.from_uid;
        const is_ready = data.message.is_ready;
        this.game_status = data.message.game_status;
        this.call_desk = data.message.call_desk;
        console.log("ReqRoomReadyUpdate", data);

        for (var i = 0; i < this.players.length; i++) {
            if (from_uid == this.players[i].id) {
                const position =this.getPosition(this.players[i].desk_id);
                if (is_ready) {
                    this[`ReadyBtnText_${position}`].string = "已准备"
                } else {
                    this[`ReadyBtnText_${position}`].string = "未准备"
                }
                break;
            }
        }
        this.showReadyBtn();
        this.showArrow();
        this.showCallScore();
    }

    // 其他人叫分 更新信息
    public ReqCallScoreUpdate(data: {[key:string]:any}) {
        if (data.error) {
            console.error("Error: " + data.error);
            return
        }
        this.game_status = data.message.game_status;
        this.call_desk = data.message.call_desk;
        if (this.game_status == 2) {
            CNet.send({
                cmd: 'ReqWatchCards',
                data: {}
            })
        }
        this.showCallScore();
        this.showArrow();
        this.showPlayCardBtn();
    }

    // 其他人出牌 更新信息
    public ReqPlayCardsUpdate(data: {[key:string]:any}) {
        if (data.error) {
            return
        }
        this.game_status = data.message.game_status;
        this.call_desk = data.message.call_desk;
        if (this.game_status == 3) {
            console.log("游戏结束");
        }
        this.played_cards = data.message.played_cards;
        for (const player of this.players) {
            if (player.id == data.from_uid){
                player.card_num = data.message.card_num;
                const position = this.getPosition(player.desk_id);
                this[`PokerArea_${position}`].removeAllChildren();
                this.renderHoldCards(position, Array(player.card_num).fill(101));
                break;
            }
        }
        if (this.played_cards.length > 0) {
            this.renderPublicCards(this.played_cards);            
        }
        this.showArrow();
    }

    // 渲染用戶信息
    private renderPlayer(player: Player) {
        const position = this.getPosition(player.desk_id);
        const user_name: Label = this[`user_${position}_name`];
        const user_coin: Label = this[`user_${position}_coin`];
        const user_avatar: Sprite = this[`user_${position}_avatar`];
        const ReadyBtnText: Label = this[`ReadyBtnText_${position}`];
        const CallScoreText: Label = this[`CallScoreText_${position}`];

        const avatarUrl = `img/avatar/${player.avatar}/spriteFrame`
        this.gameGundle.load(avatarUrl, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
            user_avatar.spriteFrame = spriteFrame;
        })
        user_name.string = `Name: ${player.name}`;
        user_coin.string = `Coin: ${player.coin}`;
        
        if (player.is_ready) {
            ReadyBtnText.string = "已准备"
        } else {
            ReadyBtnText.string = "未准备"
        }
        CallScoreText.string = `${player.call_score}分`
        if (position === 0) {
            this.renderHoldCards(position, this.my_cards)
        }else {
            this.renderHoldCards(position, Array(player.card_num).fill(101))
        }
    }

    // 渲染卡牌
    private renderHoldCards(position: number, cards: number[]) {
        const pokerArea = this[`PokerArea_${position}`];
        pokerArea.addComponent(PokerFactory).Init(this.pokerAtlas, this.pokerViewPrefab, this.pokerBackSp);
        var xpos = 0;
        var ypos = 0;
        if (position == 0) {
            var width = pokerArea.getComponent(UITransform).width;
            var xpos = Math.floor((width - (cards.length * 25)) / 2);
        }
        for (var i = 0; i < cards.length; i++) { 
            var poker = PokerFactory.Instance.CreatePoker(cards[i]); 
            if (position == 0) {
                poker.ShowValue();
                poker.node.setPosition(xpos, ypos);
                // 卡片监听 出牌选中
                poker.node.on(NodeEventType.TOUCH_END, function(event: EventTouch){
                    const {x:x, y:y} = this.node.getPosition();
                    if (this.selected == true) {
                        this.node.setPosition(x, y - 20)
                    }else {
                        this.node.setPosition(x, y + 20)
                    }
                    this.selected = !this.selected;
                }, poker)
                xpos += 25;
            }else{
                poker.ShowBack();
                poker.node.setPosition(xpos, ypos);
                xpos += 18;
            }
        }
    }

    // 渲染公告区域的卡
    private renderPublicCards(cards: number[]) {
        this.PublicPokerArea.removeAllChildren();
        this.PublicPokerArea.addComponent(PokerFactory).Init(
            this.pokerAtlas, this.pokerViewPrefab, this.pokerBackSp
        );
        var xpos = 0;
        var ypos = 0;
        this.PublicPokerArea.getScale
        var width = this.PublicPokerArea.getComponent(UITransform).width;
        var xpos = Math.floor((width - (cards.length * 25)) / 2);
        for (var i = 0; i < cards.length; i++) { 
            var poker = PokerFactory.Instance.CreatePoker(cards[i]); 
            poker.ShowValue();
            poker.node.setPosition(xpos, ypos);
            xpos += 25;
        }
    }

    // 获取玩家的位置
    private getPosition(desk_id: number) {
        return (desk_id - this.players[0].desk_id + 3) % 3
    }

    // 展示ready button
    private showReadyBtn() {
        if (this.game_status != 0) {
            this.ReadyBtn_0.active = false;
            this.ReadyBtn_1.active = false;
            this.ReadyBtn_2.active = false;
            return;
        }
        this.ReadyBtn_0.active = true;
        this.ReadyBtn_1.active = true;
        this.ReadyBtn_2.active = true;
    }

    // 展示当前操作的人
    private showArrow() {
        if (this.game_status == 0) {
            this.Arrow_0.active = false;
            this.Arrow_1.active = false;
            this.Arrow_2.active = false;
            return
        }
        this.players.forEach((val, idx)=>{
            if (val.id && val.desk_id == this.call_desk) {
                this[`Arrow_${idx}`].active = true;
            }else {
                this[`Arrow_${idx}`].active = false;
            }
        })
    }

    // 展示叫分
    private showCallScore() {
        const setCallScore = (show: boolean) => {
            this.CallScoreBtn_1.active = show;
            this.CallScoreBtn_2.active = show;
            this.CallScoreBtn_3.active = show;

            this.CallScoreText_0.enabled = show;
            this.CallScoreText_1.enabled = show;
            this.CallScoreText_2.enabled = show;
        }

        if (this.game_status != 1) {
            setCallScore(false);
            return;
        }
        setCallScore(true);
    }

    // 展示出牌按钮
    private showPlayCardBtn() {
        if (this.game_status != 2) {
            this.PlayPoker.active = false;
            this.NoPlayPoker.active = false;
            return;
        }
        this.PlayPoker.active = true;
        this.NoPlayPoker.active = true;
    }
}
