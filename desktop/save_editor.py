#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deltarune Save Editor — Десктопная версия
Автоматический поиск и редактирование сохранений Deltarune.
Поддержка Глав 1–4, демо-версий.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import os
import shutil
import datetime
import sys

# ============================================================
#  Константы и данные
# ============================================================

BG           = "#0b0b12"
BG2          = "#16213e"
BG3          = "#1a1a2e"
ACCENT       = "#9b59f4"
ACCENT_DARK  = "#7a3fd4"
TEXT         = "#ffffff"
TEXT_DIM     = "#aaaaaa"
ENTRY_BG     = "#2a2a3e"
ENTRY_FG     = "#ffffff"
HIGHLIGHT    = "#3a3a5e"

SAVE_DIR     = os.path.join(os.environ.get("LOCALAPPDATA", ""), "DELTARUNE")

# -- Оружие (Ch1) --
WEAPONS_CH1 = [
    (0, "(Ничего)"), (1, "Wood Blade"), (2, "Mane Ax"), (3, "Red Scarf"),
    (4, "EverybodyWeapon"), (5, "Spookysword"), (6, "Brave Ax"),
    (7, "Devilsknife"), (8, "Trefoil"), (9, "Ragger"), (10, "DaintyScarf"),
]

# -- Оружие (Ch2+) --
WEAPONS = WEAPONS_CH1 + [
    (11, "TwistedSwd"), (12, "SnowRing"), (13, "ThornRing"),
    (14, "BounceBlade"), (15, "CheerScarf"), (16, "MechaSaber"),
    (17, "AutoAxe"), (18, "FiberScarf"), (19, "Ragger2"),
    (20, "BrokenSwd"), (21, "PuppetScarf"), (22, "FreezeRing"),
    (23, "Saber10"), (24, "ToxicAxe"), (25, "FlexScarf"),
    (50, "JingleBlade"), (51, "ScarfMark"), (52, "JusticeAxe"),
    (53, "Winglade"), (54, "AbsorbAx"),
]

# -- Броня (Ch1) --
ARMOR_CH1 = [
    (0, "Пусто"), (1, "Amber Card"), (2, "Dice Brace"),
    (3, "Pink Ribbon"), (4, "White Ribbon"), (5, "IronShackle"),
    (6, "MouseToken"), (7, "Jevilstail"),
]

ARMOR = ARMOR_CH1 + [
    (8, "Silver Card"), (9, "TwinRibbon"), (10, "GlowWrist"),
    (11, "ChainMail"), (12, "B.ShotBowtie"), (13, "SpikeBand"),
    (14, "Silver Watch"), (15, "TensionBow"), (16, "Mannequin"),
    (17, "DarkGoldBand"), (18, "SkyMantle"), (19, "SpikeShackle"),
    (20, "FrayedBowtie"), (21, "Dealmaker"), (22, "RoyalPin"),
    (23, "ShadowMantle"), (24, "LodeStone"), (25, "GingerGuard"),
    (50, "Waterguard"), (51, "MysticBand"), (52, "PowerBand"),
    (53, "PrincessRBN"), (54, "GoldWidow"),
]

# -- Предметы (Ch1) --
ITEMS_CH1 = [
    (0, "Пусто"), (1, "Dark Candy"), (2, "ReviveMint"),
    (3, "Glowshard"), (4, "Manual"), (5, "BrokenCake"),
    (6, "TopCake"), (7, "SpinCake"), (8, "Darkburger"),
    (9, "LancerCookie"), (10, "GigaSalad"), (11, "Clubswich"),
    (12, "HeartsDonut"), (13, "ChocDiamond"), (14, "FavSandwich"),
    (15, "RouxlsRoux"),
]

ITEMS = ITEMS_CH1 + [
    (16, "CD Bagel"), (17, "Mannequin"), (18, "Kris Tea"),
    (19, "Noelle Tea"), (20, "Ralsei Tea"), (21, "Susie Tea"),
    (22, "DD-Burger"), (23, "LightCandy"), (24, "ButJuice"),
    (25, "SpagettiCode"), (26, "JavaCookie"), (27, "TensionBit"),
    (28, "TensionGem"), (29, "TensionMax"), (30, "ReviveDust"),
    (31, "ReviveBrite"), (32, "S.POISON"), (33, "DogDollar"),
]

KEY_ITEMS_CH1 = [
    (0, "Пусто"), (1, "Cell Phone"), (2, "Egg"), (3, "BrokenCake"),
    (4, "Broken Key A"), (5, "Door Key"), (6, "Broken Key B"),
    (7, "Broken Key C"),
]

KEY_ITEMS = KEY_ITEMS_CH1 + [
    (8, "Lancer"), (9, "Rouxls Kaard"), (10, "EmptyDisk"),
    (11, "LoadedDisk"), (12, "KeyGen"), (13, "ShadowCrystal"),
    (14, "Starwalker"), (15, "PureCrystal"),
]

SPELLS_CH1 = [
    (0, "Пусто"), (1, "Rude Sword"), (2, "Heal Prayer"),
    (3, "Pacify"), (4, "Rude Buster"), (5, "Red Buster"),
    (6, "Duel Heal"), (7, "ACT"),
]

SPELLS = SPELLS_CH1 + [
    (8, "SleepMist"), (9, "IceShock"), (10, "SnowGrave"),
    (11, "UltimatHeal"),
]

LW_ITEMS_CH1 = [
    (0, "Пусто"), (1, "Hot Chocolate"), (2, "Pencil"),
    (3, "Bandage"), (4, "Bouquet"), (5, "Ball of Junk"),
    (6, "Halloween Pencil"), (7, "Lucky Pencil"), (8, "Egg"),
    (11, "Glass"),
]

LW_ITEMS = LW_ITEMS_CH1 + [
    (9, "Cards"), (10, "Box of Heart Candy"),
    (12, "Eraser"), (13, "Mech. Pencil"), (14, "Wristwatch"),
]

PARTY_MEMBERS = [
    (0, "Пусто"), (1, "Крис"), (2, "Сьюзи"),
    (3, "Ральзей"), (4, "Ноэлль"),
]

ROOMS_CH1 = [
    (10316, "?????? (Dark World Closet)"), (10321, "Eye Puzzle"),
    (10326, "Castle Town"), (10330, "Field - Great Door"),
    (10337, "Field - Maze of Death"), (10340, "Seam's Shop"),
    (10349, "Field - Great Board"), (10352, "Great Board 2"),
    (10354, "Forest - Entrance"), (10363, "Forest - Bake Sale"),
    (10371, "Forest - Before Maze"), (10377, "Forest - After Maze"),
    (10378, "Forest - Thrashing Room"), (10388, "Card Castle - Prison"),
    (10392, "Card Castle - ??? (Basement)"), (10395, "Card Castle - 1F"),
    (10404, "Card Castle - 5F"), (10407, "Card Castle - Throne"),
]

ROOMS_CH2 = [
    (20003, "Queen's Mansion - Rooftop"), (20071, "My Castle Town"),
    (20084, "Dark World"), (20087, "Cyber Field Entrance"),
    (20091, "Cyber Field - Arcade Machine"), (20098, "Cyber Field - Music Shop"),
    (20121, "Cyber City - Entrance"), (20124, "Cyber City - First Alleyway"),
    (20130, "Cyber City - Music Shop"), (20135, "Cyber City - Mouse Alley"),
    (20137, "Second Alleyway"), (20142, "Cyber City - Heights"),
    (20161, "Queen's Mansion - Mess Hall"), (20166, "Queen's Mansion - Entrance"),
    (20180, "Queen's Mansion - Basement"), (20196, "Queen's Mansion - 3F"),
    (20202, "Queen's Mansion - Acid Tunnel"), (20205, "Queen's Mansion - 4F"),
]

THRASH_HEAD = [(0, "LASER"), (1, "SWORD"), (2, "FLAME"), (3, "DUCK")]
THRASH_BODY = [(0, "PLAIN"), (1, "WHEEL"), (2, "TANK"), (3, "DUCK")]
THRASH_FEET = [(0, "SNEAK"), (1, "A.WHL"), (2, "TREAD"), (3, "DUCK")]

# -- Определение полей для каждой главы --
# Формат: (line_number, label, type, data_list_or_constraints)
# type = "text" | "number" | "select" | "checkbox"

FIELDS_CH1 = {
    "Основное": [
        (1,     "Имя файла",       "text",     {"max": 6}),
        (2,     "Имя Vessel",      "text",     {"max": 6}),
        (11,    "D$ (Dark Dollars)","number",   {"min": 0, "max": 9999}),
        (10317, "Комната",         "select",   ROOMS_CH1),
        (10316, "Флаг сюжета",     "number",   {"min": 0, "max": 500}),
        (16,    "Тёмный мир",      "checkbox",  None),
    ],
    "Крис (Kris)": [
        (71,  "HP",         "number", {"min": 0, "max": 999}),
        (72,  "Макс HP",    "number", {"min": 0, "max": 999}),
        (73,  "ATK",        "number", {"min": 0, "max": 999}),
        (74,  "DEF",        "number", {"min": 0, "max": 999}),
        (75,  "MAG",        "number", {"min": 0, "max": 999}),
        (77,  "Оружие",     "select", WEAPONS_CH1),
        (78,  "Броня 1",    "select", ARMOR_CH1),
        (79,  "Броня 2",    "select", ARMOR_CH1),
        (113, "Заклинание 1","select", SPELLS_CH1),
        (114, "Заклинание 2","select", SPELLS_CH1),
        (115, "Заклинание 3","select", SPELLS_CH1),
        (116, "Заклинание 4","select", SPELLS_CH1),
        (117, "Заклинание 5","select", SPELLS_CH1),
        (118, "Заклинание 6","select", SPELLS_CH1),
    ],
    "Сьюзи (Susie)": [
        (125, "HP",         "number", {"min": 0, "max": 999}),
        (126, "Макс HP",    "number", {"min": 0, "max": 999}),
        (127, "ATK",        "number", {"min": 0, "max": 999}),
        (128, "DEF",        "number", {"min": 0, "max": 999}),
        (129, "MAG",        "number", {"min": 0, "max": 999}),
        (131, "Оружие",     "select", WEAPONS_CH1),
        (132, "Броня 1",    "select", ARMOR_CH1),
        (133, "Броня 2",    "select", ARMOR_CH1),
        (167, "Заклинание 1","select", SPELLS_CH1),
        (168, "Заклинание 2","select", SPELLS_CH1),
        (169, "Заклинание 3","select", SPELLS_CH1),
        (170, "Заклинание 4","select", SPELLS_CH1),
        (171, "Заклинание 5","select", SPELLS_CH1),
        (172, "Заклинание 6","select", SPELLS_CH1),
    ],
    "Ральзей (Ralsei)": [
        (179, "HP",         "number", {"min": 0, "max": 999}),
        (180, "Макс HP",    "number", {"min": 0, "max": 999}),
        (181, "ATK",        "number", {"min": 0, "max": 999}),
        (182, "DEF",        "number", {"min": 0, "max": 999}),
        (183, "MAG",        "number", {"min": 0, "max": 999}),
        (185, "Оружие",     "select", WEAPONS_CH1),
        (186, "Броня 1",    "select", ARMOR_CH1),
        (187, "Броня 2",    "select", ARMOR_CH1),
        (221, "Заклинание 1","select", SPELLS_CH1),
        (222, "Заклинание 2","select", SPELLS_CH1),
        (223, "Заклинание 3","select", SPELLS_CH1),
        (224, "Заклинание 4","select", SPELLS_CH1),
        (225, "Заклинание 5","select", SPELLS_CH1),
        (226, "Заклинание 6","select", SPELLS_CH1),
    ],
    "Команда": [
        (8,  "Слот 1", "select", PARTY_MEMBERS),
        (9,  "Слот 2", "select", PARTY_MEMBERS),
        (10, "Слот 3", "select", PARTY_MEMBERS),
    ],
    "Предметы": [
        (236, "Предмет 1",  "select", ITEMS_CH1),
        (240, "Предмет 2",  "select", ITEMS_CH1),
        (244, "Предмет 3",  "select", ITEMS_CH1),
        (248, "Предмет 4",  "select", ITEMS_CH1),
        (252, "Предмет 5",  "select", ITEMS_CH1),
        (256, "Предмет 6",  "select", ITEMS_CH1),
        (260, "Предмет 7",  "select", ITEMS_CH1),
        (264, "Предмет 8",  "select", ITEMS_CH1),
        (268, "Предмет 9",  "select", ITEMS_CH1),
        (272, "Предмет 10", "select", ITEMS_CH1),
        (276, "Предмет 11", "select", ITEMS_CH1),
        (280, "Предмет 12", "select", ITEMS_CH1),
    ],
    "Ключевые предметы": [
        (237, "Ключ. предмет 1",  "select", KEY_ITEMS_CH1),
        (241, "Ключ. предмет 2",  "select", KEY_ITEMS_CH1),
        (245, "Ключ. предмет 3",  "select", KEY_ITEMS_CH1),
        (249, "Ключ. предмет 4",  "select", KEY_ITEMS_CH1),
        (253, "Ключ. предмет 5",  "select", KEY_ITEMS_CH1),
        (257, "Ключ. предмет 6",  "select", KEY_ITEMS_CH1),
        (261, "Ключ. предмет 7",  "select", KEY_ITEMS_CH1),
        (265, "Ключ. предмет 8",  "select", KEY_ITEMS_CH1),
        (269, "Ключ. предмет 9",  "select", KEY_ITEMS_CH1),
        (273, "Ключ. предмет 10", "select", KEY_ITEMS_CH1),
        (277, "Ключ. предмет 11", "select", KEY_ITEMS_CH1),
        (281, "Ключ. предмет 12", "select", KEY_ITEMS_CH1),
    ],
    "Оружие (инвентарь)": [
        (238, "Оружие 1",  "select", WEAPONS_CH1),
        (242, "Оружие 2",  "select", WEAPONS_CH1),
        (246, "Оружие 3",  "select", WEAPONS_CH1),
        (250, "Оружие 4",  "select", WEAPONS_CH1),
        (254, "Оружие 5",  "select", WEAPONS_CH1),
        (258, "Оружие 6",  "select", WEAPONS_CH1),
        (262, "Оружие 7",  "select", WEAPONS_CH1),
        (266, "Оружие 8",  "select", WEAPONS_CH1),
        (270, "Оружие 9",  "select", WEAPONS_CH1),
        (274, "Оружие 10", "select", WEAPONS_CH1),
        (278, "Оружие 11", "select", WEAPONS_CH1),
        (282, "Оружие 12", "select", WEAPONS_CH1),
    ],
    "Броня (инвентарь)": [
        (239, "Броня 1",  "select", ARMOR_CH1),
        (243, "Броня 2",  "select", ARMOR_CH1),
        (247, "Броня 3",  "select", ARMOR_CH1),
        (251, "Броня 4",  "select", ARMOR_CH1),
        (255, "Броня 5",  "select", ARMOR_CH1),
        (259, "Броня 6",  "select", ARMOR_CH1),
        (263, "Броня 7",  "select", ARMOR_CH1),
        (267, "Броня 8",  "select", ARMOR_CH1),
        (271, "Броня 9",  "select", ARMOR_CH1),
        (275, "Броня 10", "select", ARMOR_CH1),
        (279, "Броня 11", "select", ARMOR_CH1),
        (283, "Броня 12", "select", ARMOR_CH1),
    ],
    "Светлый мир": [
        (294, "$ (Gold)",    "number", {"min": 0, "max": 9999}),
        (295, "HP",          "number", {"min": 0, "max": 999}),
        (296, "Макс HP",     "number", {"min": 0, "max": 999}),
        (293, "LV",          "number", {"min": 1, "max": 20}),
        (292, "EXP",         "number", {"min": 0, "max": 99999}),
        (297, "AT",          "number", {"min": 0, "max": 999}),
        (298, "DF",          "number", {"min": 0, "max": 999}),
    ],
    "Машина Лансера": [
        (537, "Голова",  "select", THRASH_HEAD),
        (538, "Корпус",  "select", THRASH_BODY),
        (539, "Ноги",    "select", THRASH_FEET),
    ],
    "Флаги и события": [
        (423,  "Съел мох",      "checkbox", None),
        (558,  "Jevil побеждён", "number",  {"min": 0, "max": 2}),
        (571,  "Starwalker",    "number",  {"min": 0, "max": 5}),
        (1228, "Egg",           "number",  {"min": 0, "max": 99}),
        (569,  "Darkner Items", "number",  {"min": 0, "max": 99}),
        (570,  "LW Items",     "number",  {"min": 0, "max": 99}),
    ],
}

FIELDS_CH2 = {
    "Основное": [
        (1,     "Имя файла",       "text",     {"max": 6}),
        (2,     "Имя Vessel",      "text",     {"max": 6}),
        (11,    "D$ (Dark Dollars)","number",   {"min": 0, "max": 9999}),
        (16,    "Тёмный мир",      "checkbox",  None),
    ],
    "Крис (Kris)": [
        (79,  "HP",         "number", {"min": 0, "max": 999}),
        (80,  "Макс HP",    "number", {"min": 0, "max": 999}),
        (81,  "ATK",        "number", {"min": 0, "max": 999}),
        (82,  "DEF",        "number", {"min": 0, "max": 999}),
        (83,  "MAG",        "number", {"min": 0, "max": 999}),
        (85,  "Оружие",     "select", WEAPONS),
        (86,  "Броня 1",    "select", ARMOR),
        (87,  "Броня 2",    "select", ARMOR),
        (129, "Заклинание 1","select", SPELLS),
        (130, "Заклинание 2","select", SPELLS),
        (131, "Заклинание 3","select", SPELLS),
        (132, "Заклинание 4","select", SPELLS),
        (133, "Заклинание 5","select", SPELLS),
        (134, "Заклинание 6","select", SPELLS),
    ],
    "Сьюзи (Susie)": [
        (141, "HP",         "number", {"min": 0, "max": 999}),
        (142, "Макс HP",    "number", {"min": 0, "max": 999}),
        (143, "ATK",        "number", {"min": 0, "max": 999}),
        (144, "DEF",        "number", {"min": 0, "max": 999}),
        (145, "MAG",        "number", {"min": 0, "max": 999}),
        (147, "Оружие",     "select", WEAPONS),
        (148, "Броня 1",    "select", ARMOR),
        (149, "Броня 2",    "select", ARMOR),
        (191, "Заклинание 1","select", SPELLS),
        (192, "Заклинание 2","select", SPELLS),
        (193, "Заклинание 3","select", SPELLS),
        (194, "Заклинание 4","select", SPELLS),
        (195, "Заклинание 5","select", SPELLS),
        (196, "Заклинание 6","select", SPELLS),
    ],
    "Ральзей (Ralsei)": [
        (203, "HP",         "number", {"min": 0, "max": 999}),
        (204, "Макс HP",    "number", {"min": 0, "max": 999}),
        (205, "ATK",        "number", {"min": 0, "max": 999}),
        (206, "DEF",        "number", {"min": 0, "max": 999}),
        (207, "MAG",        "number", {"min": 0, "max": 999}),
        (209, "Оружие",     "select", WEAPONS),
        (210, "Броня 1",    "select", ARMOR),
        (211, "Броня 2",    "select", ARMOR),
        (253, "Заклинание 1","select", SPELLS),
        (254, "Заклинание 2","select", SPELLS),
        (255, "Заклинание 3","select", SPELLS),
        (256, "Заклинание 4","select", SPELLS),
        (257, "Заклинание 5","select", SPELLS),
        (258, "Заклинание 6","select", SPELLS),
    ],
    "Ноэлль (Noelle)": [
        (265, "HP",         "number", {"min": 0, "max": 999}),
        (266, "Макс HP",    "number", {"min": 0, "max": 999}),
        (267, "ATK",        "number", {"min": 0, "max": 999}),
        (268, "DEF",        "number", {"min": 0, "max": 999}),
        (269, "MAG",        "number", {"min": 0, "max": 999}),
        (271, "Оружие",     "select", WEAPONS),
        (272, "Броня 1",    "select", ARMOR),
        (273, "Броня 2",    "select", ARMOR),
        (315, "Заклинание 1","select", SPELLS),
        (316, "Заклинание 2","select", SPELLS),
        (317, "Заклинание 3","select", SPELLS),
        (318, "Заклинание 4","select", SPELLS),
        (319, "Заклинание 5","select", SPELLS),
        (320, "Заклинание 6","select", SPELLS),
    ],
    "Команда": [
        (8,  "Слот 1", "select", PARTY_MEMBERS),
        (9,  "Слот 2", "select", PARTY_MEMBERS),
        (10, "Слот 3", "select", PARTY_MEMBERS),
    ],
    "Предметы": [
        (330, "Предмет 1",  "select", ITEMS),
        (334, "Предмет 2",  "select", ITEMS),
        (338, "Предмет 3",  "select", ITEMS),
        (342, "Предмет 4",  "select", ITEMS),
        (346, "Предмет 5",  "select", ITEMS),
        (350, "Предмет 6",  "select", ITEMS),
        (354, "Предмет 7",  "select", ITEMS),  # adjusted — may be 354 not 353
        (358, "Предмет 8",  "select", ITEMS),
        (362, "Предмет 9",  "select", ITEMS),
        (366, "Предмет 10", "select", ITEMS),
        (370, "Предмет 11", "select", ITEMS),
        (374, "Предмет 12", "select", ITEMS),
    ],
    "Ключевые предметы": [
        (331, "Ключ. предмет 1",  "select", KEY_ITEMS),
        (335, "Ключ. предмет 2",  "select", KEY_ITEMS),
        (339, "Ключ. предмет 3",  "select", KEY_ITEMS),
        (343, "Ключ. предмет 4",  "select", KEY_ITEMS),
        (347, "Ключ. предмет 5",  "select", KEY_ITEMS),
        (351, "Ключ. предмет 6",  "select", KEY_ITEMS),
        (355, "Ключ. предмет 7",  "select", KEY_ITEMS),
        (359, "Ключ. предмет 8",  "select", KEY_ITEMS),
        (363, "Ключ. предмет 9",  "select", KEY_ITEMS),
        (367, "Ключ. предмет 10", "select", KEY_ITEMS),
        (371, "Ключ. предмет 11", "select", KEY_ITEMS),
        (375, "Ключ. предмет 12", "select", KEY_ITEMS),
    ],
    "Оружие (инвентарь)": [
        (332, "Оружие 1",  "select", WEAPONS),
        (336, "Оружие 2",  "select", WEAPONS),
        (340, "Оружие 3",  "select", WEAPONS),
        (344, "Оружие 4",  "select", WEAPONS),
        (348, "Оружие 5",  "select", WEAPONS),
        (352, "Оружие 6",  "select", WEAPONS),
        (356, "Оружие 7",  "select", WEAPONS),
        (360, "Оружие 8",  "select", WEAPONS),
        (364, "Оружие 9",  "select", WEAPONS),
        (368, "Оружие 10", "select", WEAPONS),
        (372, "Оружие 11", "select", WEAPONS),
        (376, "Оружие 12", "select", WEAPONS),
    ],
    "Броня (инвентарь)": [
        (333, "Броня 1",  "select", ARMOR),
        (337, "Броня 2",  "select", ARMOR),
        (341, "Броня 3",  "select", ARMOR),
        (345, "Броня 4",  "select", ARMOR),
        (349, "Броня 5",  "select", ARMOR),
        (353, "Броня 6",  "select", ARMOR),
        (357, "Броня 7",  "select", ARMOR),
        (361, "Броня 8",  "select", ARMOR),
        (365, "Броня 9",  "select", ARMOR),
        (369, "Броня 10", "select", ARMOR),
        (373, "Броня 11", "select", ARMOR),
        (377, "Броня 12", "select", ARMOR),
    ],
    "Светлый мир": [
        (530, "$ (Gold)",    "number", {"min": 0, "max": 9999}),
        (531, "HP",          "number", {"min": 0, "max": 999}),
        (532, "Макс HP",     "number", {"min": 0, "max": 999}),
        (529, "LV",          "number", {"min": 1, "max": 20}),
        (528, "EXP",         "number", {"min": 0, "max": 99999}),
        (533, "AT",          "number", {"min": 0, "max": 999}),
        (534, "DF",          "number", {"min": 0, "max": 999}),
    ],
    "Машина Лансера": [
        (773, "Голова",  "select", THRASH_HEAD),
        (774, "Корпус",  "select", THRASH_BODY),
        (775, "Ноги",    "select", THRASH_FEET),
    ],
    "Флаги и события": [
        (659,  "Ate Moss",       "checkbox", None),
        (794,  "Jevil побеждён", "number",  {"min": 0, "max": 2}),
        (807,  "Starwalker",     "number",  {"min": 0, "max": 5}),
        (878,  "Spamton NEO",    "number",  {"min": 0, "max": 2}),
        (806,  "Egg",            "number",  {"min": 0, "max": 99}),
    ],
}

# Маппинг глав: имя файла -> (config, expected_length)
CHAPTER_MAP = {
    "filech1_0": ("Глава 1", FIELDS_CH1, 10318),
    "filech2_0": ("Глава 2", FIELDS_CH2, 3055),
    "filech3_0": ("Глава 3", FIELDS_CH2, 3055),  # Ch3/4 используют ту же структуру что Ch2
    "filech4_0": ("Глава 4", FIELDS_CH2, 3055),
}


# ============================================================
#  Стиль (ttk тема)
# ============================================================

def apply_theme(root):
    style = ttk.Style()
    style.theme_use("clam")

    style.configure(".", background=BG, foreground=TEXT, fieldbackground=ENTRY_BG)
    style.configure("TFrame",       background=BG)
    style.configure("TLabel",       background=BG, foreground=TEXT, font=("Segoe UI", 10))
    style.configure("TButton",      background=ACCENT, foreground=TEXT, font=("Segoe UI", 10, "bold"), padding=6)
    style.map("TButton",
              background=[("active", ACCENT_DARK), ("pressed", ACCENT_DARK)],
              foreground=[("active", TEXT)])
    style.configure("TEntry",       fieldbackground=ENTRY_BG, foreground=ENTRY_FG, insertcolor=TEXT)
    style.configure("TCombobox",    fieldbackground=ENTRY_BG, foreground=ENTRY_FG, selectbackground=ACCENT)
    style.map("TCombobox",
              fieldbackground=[("readonly", ENTRY_BG)],
              selectbackground=[("readonly", ACCENT)],
              foreground=[("readonly", TEXT)])
    style.configure("TNotebook",    background=BG2, borderwidth=0)
    style.configure("TNotebook.Tab", background=BG3, foreground=TEXT_DIM,
                    font=("Segoe UI", 10), padding=[12, 6])
    style.map("TNotebook.Tab",
              background=[("selected", ACCENT)],
              foreground=[("selected", TEXT)])
    style.configure("Treeview",     background=BG3, foreground=TEXT, fieldbackground=BG3,
                    font=("Segoe UI", 10), rowheight=28)
    style.configure("Treeview.Heading", background=BG2, foreground=ACCENT, font=("Segoe UI", 10, "bold"))
    style.map("Treeview", background=[("selected", ACCENT)])
    style.configure("TLabelframe",       background=BG, foreground=ACCENT)
    style.configure("TLabelframe.Label", background=BG, foreground=ACCENT, font=("Segoe UI", 11, "bold"))
    style.configure("Sidebar.TFrame",    background=BG2)
    style.configure("Sidebar.TLabel",    background=BG2, foreground=TEXT)
    style.configure("Sidebar.TButton",   background=ACCENT, foreground=TEXT)
    style.configure("StatusBar.TFrame",  background=BG3)
    style.configure("StatusBar.TLabel",  background=BG3, foreground=TEXT_DIM, font=("Segoe UI", 9))
    style.configure("Title.TLabel", font=("Segoe UI", 24, "bold"), foreground=ACCENT, background=BG2)
    style.configure("Subtitle.TLabel", font=("Segoe UI", 11), foreground=TEXT_DIM, background=BG2)
    style.configure("Section.TLabel", font=("Segoe UI", 13, "bold"), foreground=ACCENT, background=BG)
    style.configure("Save.TButton", background="#4CAF50", foreground="white", font=("Segoe UI", 11, "bold"), padding=10)
    style.map("Save.TButton", background=[("active", "#388E3C")])
    style.configure("Danger.TButton", background="#e74c3c", foreground="white")
    style.map("Danger.TButton", background=[("active", "#c0392b")])


# ============================================================
#  Главное окно приложения
# ============================================================

class SaveEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Deltarune Save Editor")
        self.root.geometry("1200x780")
        self.root.configure(bg=BG)
        self.root.minsize(900, 600)

        apply_theme(root)

        self.lines = []           # Все строки сейва
        self.current_path = None  # Путь к текущему файлу
        self.current_name = None
        self.fields_cfg = None    # Конфигурация полей для текущей главы
        self.widgets = {}         # {line_number: widget}  — для чтения/записи значений
        self.chapter_label = ""
        self.expected_length = 0

        self._build_ui()
        self._auto_scan()

    # ----------------------------------------------------------------
    #  Построение интерфейса
    # ----------------------------------------------------------------

    def _build_ui(self):
        # --- Header ---
        header = ttk.Frame(self.root, style="TFrame")
        header.pack(fill="x")
        header_inner = tk.Frame(header, bg=BG2, bd=0)
        header_inner.pack(fill="x", ipady=12)
        ttk.Label(header_inner, text="[SPAMTON]  SAVE EDITOR", style="Title.TLabel").pack(side="left", padx=20)
        ttk.Label(header_inner, text="Десктопная версия — автопоиск сейвов", style="Subtitle.TLabel").pack(side="left", padx=10)

        # --- Main body = Sidebar + Editor ---
        body = ttk.Frame(self.root)
        body.pack(fill="both", expand=True)

        # Sidebar
        sidebar = tk.Frame(body, bg=BG2, width=320)
        sidebar.pack(side="left", fill="y")
        sidebar.pack_propagate(False)

        ttk.Label(sidebar, text="Действия", style="Section.TLabel").pack(anchor="w", padx=14, pady=(14, 4))

        btn_frame = tk.Frame(sidebar, bg=BG2)
        btn_frame.pack(fill="x", padx=12, pady=4)

        ttk.Button(btn_frame, text="🔄  Обновить список", command=self._auto_scan).pack(fill="x", pady=3)
        ttk.Button(btn_frame, text="📁  Открыть папку сейвов", command=self._open_folder).pack(fill="x", pady=3)
        ttk.Button(btn_frame, text="📂  Выбрать файл…", command=self._open_file_dialog).pack(fill="x", pady=3)

        ttk.Label(sidebar, text="Найденные сохранения", style="Section.TLabel").pack(anchor="w", padx=14, pady=(18, 4))

        tree_frame = tk.Frame(sidebar, bg=BG2)
        tree_frame.pack(fill="both", expand=True, padx=12, pady=4)

        self.tree = ttk.Treeview(tree_frame, columns=("size", "modified"), show="tree headings",
                                 selectmode="browse", height=14)
        self.tree.heading("#0",       text="Файл")
        self.tree.heading("size",     text="Размер")
        self.tree.heading("modified", text="Изменён")
        self.tree.column("#0",       width=110, minwidth=80)
        self.tree.column("size",     width=60, minwidth=50)
        self.tree.column("modified", width=120, minwidth=80)
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<<TreeviewSelect>>", self._on_select_file)

        # Editor area
        self.editor_frame = tk.Frame(body, bg=BG)
        self.editor_frame.pack(side="left", fill="both", expand=True)

        # Welcome message
        self.welcome = tk.Frame(self.editor_frame, bg=BG)
        self.welcome.pack(fill="both", expand=True)
        tk.Label(self.welcome, text="Добро пожаловать!", font=("Segoe UI", 28, "bold"),
                 fg=ACCENT, bg=BG).pack(pady=(80, 10))
        tk.Label(self.welcome, text="Выберите сохранение слева для начала редактирования",
                 font=("Segoe UI", 14), fg=TEXT_DIM, bg=BG).pack()
        tk.Label(self.welcome, text="Редактор автоматически находит сейвы Deltarune\nи позволяет менять их напрямую",
                 font=("Segoe UI", 11), fg=TEXT_DIM, bg=BG, justify="center").pack(pady=30)

        # Notebook (tabs) – initially hidden
        self.notebook_frame = tk.Frame(self.editor_frame, bg=BG)

        # Toolbar on top of notebook
        self.toolbar = tk.Frame(self.notebook_frame, bg=BG)
        self.toolbar.pack(fill="x", padx=10, pady=(8, 2))
        self.file_label = tk.Label(self.toolbar, text="", font=("Segoe UI", 12, "bold"),
                                   fg=ACCENT, bg=BG, anchor="w")
        self.file_label.pack(side="left")

        self.btn_save = ttk.Button(self.toolbar, text="💾  Сохранить изменения", command=self._save_file,
                                   style="Save.TButton")
        self.btn_save.pack(side="right", padx=4)
        self.btn_export = ttk.Button(self.toolbar, text="📥  Экспорт", command=self._export_file)
        self.btn_export.pack(side="right", padx=4)
        self.btn_backup = ttk.Button(self.toolbar, text="🛡  Создать бэкап", command=self._create_backup)
        self.btn_backup.pack(side="right", padx=4)

        self.notebook = ttk.Notebook(self.notebook_frame)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=6)

        # --- Status bar ---
        status = ttk.Frame(self.root, style="StatusBar.TFrame")
        status.pack(fill="x", side="bottom")
        self.status_var = tk.StringVar(value="Готов к работе")
        ttk.Label(status, textvariable=self.status_var, style="StatusBar.TLabel").pack(side="left", padx=12, pady=4)
        self.path_var = tk.StringVar(value="")
        ttk.Label(status, textvariable=self.path_var, style="StatusBar.TLabel").pack(side="right", padx=12, pady=4)

    # ----------------------------------------------------------------
    #  Автопоиск сохранений
    # ----------------------------------------------------------------

    def _auto_scan(self):
        self.tree.delete(*self.tree.get_children())
        self.status_var.set("Поиск сохранений Deltarune…")
        self.root.update_idletasks()

        if not os.path.isdir(SAVE_DIR):
            self.status_var.set("Папка DELTARUNE не найдена в AppData. Убедитесь что игра установлена.")
            return

        count = 0
        for fname in sorted(os.listdir(SAVE_DIR)):
            fpath = os.path.join(SAVE_DIR, fname)
            if not os.path.isfile(fpath):
                continue
            if not fname.startswith("file"):
                continue
            try:
                st = os.stat(fpath)
                size_kb = f"{st.st_size / 1024:.1f} KB"
                mtime = datetime.datetime.fromtimestamp(st.st_mtime).strftime("%d.%m.%Y %H:%M")
                self.tree.insert("", "end", iid=fpath, text=fname, values=(size_kb, mtime))
                count += 1
            except OSError:
                pass

        self.status_var.set(f"Найдено сохранений: {count}" if count else "Сохранения не найдены")

    # ----------------------------------------------------------------
    #  Обработка выбора файла
    # ----------------------------------------------------------------

    def _on_select_file(self, _event=None):
        sel = self.tree.selection()
        if not sel:
            return
        path = sel[0]
        fname = os.path.basename(path)
        self._load_file(path, fname)

    def _open_file_dialog(self):
        path = filedialog.askopenfilename(
            title="Выберите файл сохранения",
            initialdir=SAVE_DIR if os.path.isdir(SAVE_DIR) else os.path.expanduser("~"),
        )
        if path:
            self._load_file(path, os.path.basename(path))

    def _open_folder(self):
        if os.path.isdir(SAVE_DIR):
            os.startfile(SAVE_DIR)
        else:
            messagebox.showwarning("Ошибка", "Папка DELTARUNE не найдена.\n" + SAVE_DIR)

    # ----------------------------------------------------------------
    #  Чтение / парсинг сейва
    # ----------------------------------------------------------------

    def _load_file(self, path, fname):
        self.status_var.set(f"Загрузка {fname}…")
        self.root.update_idletasks()
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                raw = f.read()
        except Exception as e:
            messagebox.showerror("Ошибка чтения", str(e))
            return

        # Нормализация переводов строк
        raw = raw.replace("\r\n", "\n").replace("\r", "\n")
        self.lines = raw.split("\n")

        self.current_path = path
        self.current_name = fname
        self.path_var.set(path)

        # Определить главу по имени файла
        base = fname.lower()
        cfg_entry = CHAPTER_MAP.get(base)
        if cfg_entry:
            self.chapter_label, self.fields_cfg, self.expected_length = cfg_entry
        else:
            # Попробовать угадать по количеству строк
            if len(self.lines) >= 10000:
                self.chapter_label = "Глава 1 (угадано)"
                self.fields_cfg = FIELDS_CH1
                self.expected_length = 10318
            else:
                self.chapter_label = "Глава 2+ (угадано)"
                self.fields_cfg = FIELDS_CH2
                self.expected_length = 3055

        self._build_editor()
        self.status_var.set(f"Загружен: {fname} — {self.chapter_label} ({len(self.lines)} строк)")

    # ----------------------------------------------------------------
    #  Построение редактора
    # ----------------------------------------------------------------

    def _build_editor(self):
        self.welcome.pack_forget()

        # Очистить notebook
        for tab_id in self.notebook.tabs():
            self.notebook.forget(tab_id)
        self.widgets.clear()

        self.file_label.config(text=f"{self.chapter_label}  —  {self.current_name}")

        self.notebook_frame.pack(fill="both", expand=True)

        for section_name, fields in self.fields_cfg.items():
            tab = ttk.Frame(self.notebook)
            self.notebook.add(tab, text=section_name)

            # Scrollable canvas
            canvas = tk.Canvas(tab, bg=BG, highlightthickness=0)
            scrollbar = ttk.Scrollbar(tab, orient="vertical", command=canvas.yview)
            scroll_frame = tk.Frame(canvas, bg=BG)

            scroll_frame.bind("<Configure>", lambda e, c=canvas: c.configure(scrollregion=c.bbox("all")))
            canvas_window = canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
            canvas.configure(yscrollcommand=scrollbar.set)

            # Размер по ширине
            canvas.bind("<Configure>", lambda e, cw=canvas_window, c=canvas: c.itemconfig(cw, width=e.width))

            canvas.pack(side="left", fill="both", expand=True)
            scrollbar.pack(side="right", fill="y")

            # Прокрутка колёсиком
            def _on_mousewheel(event, c=canvas):
                c.yview_scroll(int(-1 * (event.delta / 120)), "units")
            canvas.bind_all("<MouseWheel>", _on_mousewheel, add="+")

            # Заполнить полями
            for row_idx, (line_num, label, ftype, fdata) in enumerate(fields):
                self._add_field(scroll_frame, row_idx, line_num, label, ftype, fdata)

    def _get_line_value(self, line_num):
        """Получить значение строки (1-based)."""
        idx = line_num - 1
        if 0 <= idx < len(self.lines):
            return self.lines[idx].strip()
        return ""

    def _add_field(self, parent, row, line_num, label, ftype, fdata):
        lbl = tk.Label(parent, text=label, fg=TEXT, bg=BG, font=("Segoe UI", 10),
                       anchor="w", width=22)
        lbl.grid(row=row, column=0, padx=(16, 8), pady=4, sticky="w")

        current_val = self._get_line_value(line_num)

        if ftype == "text":
            var = tk.StringVar(value=current_val)
            entry = ttk.Entry(parent, textvariable=var, width=30)
            if fdata and "max" in fdata:
                entry.config(width=fdata["max"] + 4)
            entry.grid(row=row, column=1, padx=4, pady=4, sticky="w")
            self.widgets[line_num] = var

        elif ftype == "number":
            var = tk.StringVar(value=current_val)
            entry = ttk.Entry(parent, textvariable=var, width=12)
            entry.grid(row=row, column=1, padx=4, pady=4, sticky="w")
            # Подсказка с диапазоном
            if fdata:
                hint = f"({fdata.get('min', '')}–{fdata.get('max', '')})"
                tk.Label(parent, text=hint, fg=TEXT_DIM, bg=BG,
                         font=("Segoe UI", 9)).grid(row=row, column=2, padx=4, sticky="w")
            self.widgets[line_num] = var

        elif ftype == "select":
            options = fdata if fdata else []
            val_map = {str(v): t for v, t in options}
            display_list = [f"{v} — {t}" for v, t in options]

            var = tk.StringVar()
            combo = ttk.Combobox(parent, textvariable=var, values=display_list,
                                 state="readonly", width=36)

            # Установить текущее значение
            for i, (v, t) in enumerate(options):
                if str(v) == current_val:
                    combo.current(i)
                    break
            else:
                # Если не нашли — показать raw значение
                var.set(f"{current_val} — (неизвестно)")

            combo.grid(row=row, column=1, padx=4, pady=4, sticky="w")
            combo._options_list = options  # сохраняем для чтения
            self.widgets[line_num] = (var, options)

        elif ftype == "checkbox":
            var = tk.IntVar(value=1 if current_val in ("1", "true", "True") else 0)
            cb = tk.Checkbutton(parent, variable=var, bg=BG, fg=TEXT,
                                selectcolor=ENTRY_BG, activebackground=BG,
                                activeforeground=TEXT, font=("Segoe UI", 10))
            cb.grid(row=row, column=1, padx=4, pady=4, sticky="w")
            self.widgets[line_num] = var

        # Номер строки (подсказка)
        tk.Label(parent, text=f"[{line_num}]", fg="#555555", bg=BG,
                 font=("Segoe UI", 8)).grid(row=row, column=3, padx=4, sticky="e")

    # ----------------------------------------------------------------
    #  Сохранение
    # ----------------------------------------------------------------

    def _collect_values(self):
        """Собрать значения из виджетов обратно в self.lines."""
        for line_num, widget in self.widgets.items():
            idx = line_num - 1
            if idx < 0:
                continue

            # Расширить, если нужно
            while idx >= len(self.lines):
                self.lines.append("")

            if isinstance(widget, tuple):
                # Combobox: (var, options)
                var, options = widget
                raw = var.get()
                # Извлечь числовое значение до " — "
                if " — " in raw:
                    val_str = raw.split(" — ")[0].strip()
                else:
                    val_str = raw.strip()
                self.lines[idx] = val_str
            elif isinstance(widget, tk.IntVar):
                self.lines[idx] = str(widget.get())
            elif isinstance(widget, tk.StringVar):
                self.lines[idx] = widget.get()

    def _save_file(self):
        if not self.current_path:
            messagebox.showwarning("Ошибка", "Файл не выбран")
            return

        self._collect_values()

        # Автобэкап
        try:
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.current_path + f".backup_{ts}"
            shutil.copy2(self.current_path, backup_path)
        except Exception as e:
            if not messagebox.askyesno("Бэкап", f"Не удалось создать бэкап:\n{e}\n\nПродолжить сохранение?"):
                return

        try:
            data = "\r\n".join(self.lines)
            with open(self.current_path, "w", encoding="utf-8", newline="") as f:
                f.write(data)
            self.status_var.set(f"✓ Сохранено: {self.current_name}")
            self._auto_scan()  # Обновить список
        except Exception as e:
            messagebox.showerror("Ошибка", f"Не удалось сохранить:\n{e}")

    def _export_file(self):
        if not self.lines:
            messagebox.showwarning("Ошибка", "Нет загруженных данных")
            return
        self._collect_values()
        path = filedialog.asksaveasfilename(
            title="Экспортировать файл сохранения",
            initialfile=self.current_name or "filech1_0",
            defaultextension="",
        )
        if path:
            try:
                data = "\r\n".join(self.lines)
                with open(path, "w", encoding="utf-8", newline="") as f:
                    f.write(data)
                self.status_var.set(f"✓ Экспортировано: {os.path.basename(path)}")
            except Exception as e:
                messagebox.showerror("Ошибка", str(e))

    def _create_backup(self):
        if not self.current_path:
            return
        try:
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup = self.current_path + f".backup_{ts}"
            shutil.copy2(self.current_path, backup)
            self.status_var.set(f"✓ Бэкап создан: {os.path.basename(backup)}")
        except Exception as e:
            messagebox.showerror("Ошибка", str(e))


# ============================================================
#  Точка входа
# ============================================================

def main():
    root = tk.Tk()

    # Иконка (если есть)
    icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icon.ico")
    if os.path.isfile(icon_path):
        try:
            root.iconbitmap(icon_path)
        except Exception:
            pass

    app = SaveEditorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
