---
title: "Spin-Go 개발일지 - 레벨 디자인 및 기능 추가"
date: 2025-08-22
categories: [Diary, GameDevLog, Spin-Go]
tags: [Godot, JavaScript, HTML, CSS, GameDevelopment, LevelDesign, UI]
---

## 👋 개요

오늘 우리는 Spin-Go 게임에 다양한 레벨 디자인 요소와 편의 기능을 추가하여 플레이 경험을 개선하는 작업을 진행했습니다. 맵 생성 방식, 플레이어 조작, 스테이지 진행 및 장애물 동작에 여러 변화를 주었죠.

---

## 📝 오늘 한 일

-   초기 맵 생성 방식 변경 (랜덤 제거, '+' 모양 고정)
-   플레이어 초기 및 리스폰 위치 조정
-   복도 길이 확장
-   모바일용 플로팅 조이스틱 구현 및 데스크톱 마우스 지원 추가
-   스테이지 카운터 및 총 플레이 시간 타이머 (HUD) 추가
-   스테이지 진행 로직 재구현 (출구 도달 시 다음 스테이지)
-   스테이지 클리어 시 타이머 리셋 방지
-   단계별 장애물 가시성 및 회전 동작 정의
-   충돌 시 1단계로 리셋 기능 구현
-   이전 출구 방향을 제외한 다음 스테이지 출구 무작위 생성

---

## ✨ 주요 작업 내용

### 맵 생성 및 구조 개선

초기 무작위 맵 생성 로직을 제거하고, 항상 고정된 '+' 모양의 맵이 생성되도록 변경했습니다. 또한, 플레이어가 맵의 끝에 도달했을 때 중앙이 시야에서 사라지도록 복도의 길이를 확장하여 맵의 규모감을 더했습니다. 이제 맵은 더 이상 무작위로 변하지 않고, 정해진 형태를 유지합니다.

**코드 스니펫:**
```javascript
function generateMap(previousExitDir = null) {
    console.log(`Generating map for stage ${stage}`);
    map.corridors = [];
    const corridorWidth = 100;
    const corridorLength = 1000; // 복도 길이 확장
    const exitLength = 5; // 출구 크기 축소

    // 기본 복도 생성
    map.corridors.push({ x: map.centerX - corridorWidth / 2, y: map.centerY - corridorLength / 2, width: corridorWidth, height: corridorLength });
    map.corridors.push({ x: map.centerX - corridorLength / 2, y: map.centerY - corridorWidth / 2, width: corridorLength, height: corridorWidth });

    // 출구 생성 로직 (이전 출구 방향 제외)
    let possibleDirections = ['n', 's', 'w', 'e'];
    if (previousExitDir) {
        possibleDirections = possibleDirections.filter(dir => dir !== previousExitDir);
    }
    const exitDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    // ... 출구 위치 계산 및 추가 ...
}
```

### 플레이어 조작 및 HUD

플레이어의 초기 시작 위치와 충돌 후 리스폰 위치를 맵 중앙에서 왼쪽으로 조정했습니다. 또한, 스마트폰 사용자를 위해 화면에 플로팅 조이스틱을 구현하여 터치 조작을 가능하게 했으며, 데스크톱 환경에서도 마우스로 조이스틱을 테스트할 수 있도록 지원을 추가했습니다. 게임 화면 상단에는 현재 스테이지와 총 플레이 시간을 표시하는 HUD를 추가하여 플레이어가 진행 상황을 한눈에 파악할 수 있도록 했습니다.

**코드 스니펫 (조이스틱 관련):**
```javascript
// 조이스틱 설정
const joystick = { /* ... */ };

// 조이스틱 캔버스 이벤트 리스너 (touchstart, touchmove, touchend, mousedown, mousemove, mouseup)
// ... handleJoystickMove, stopJoystick 함수 ...
```

### 스테이지 진행 및 장애물 동작

플레이어가 맵의 출구에 도달하면 다음 스테이지로 진행되도록 로직을 재구현했습니다. 이때 타이머는 리셋되지 않고 총 플레이 시간을 계속 측정합니다. 장애물은 1단계에서는 나타나지 않고, 2단계부터 등장하지만 회전은 하지 않습니다. 3단계부터는 회전하기 시작하며, 단계가 올라갈수록 회전 속도가 점진적으로 증가하여 난이도가 상승합니다. 플레이어가 장애물과 충돌하면 1단계로 돌아가도록 설정하여 게임 오버 시 초기 상태로 복귀하도록 했습니다.

**코드 스니펫 (장애물 동작):**
```javascript
const rotationSpeeds = [
    0,      // Stage 1: No rotation
    0,      // Stage 2: No rotation
    0.03,   // Stage 3: Base speed + (3-1)*0.005
    // ...
];

function updateObstacle() {
    if (stage < 2) return; // 1단계에서는 장애물 없음
    obstacle.x = map.centerX;
    obstacle.y = map.centerY;

    let currentRotationSpeed = rotationSpeeds[stage] || 0;
    obstacle.angle += currentRotationSpeed;
}
```

---

## 겪었던 문제 및 해결 과정

**문제:**
1.  **조이스틱 오작동:** `Math.atan2` 함수의 오타(`Math.atane`)로 인해 조이스틱이 전혀 작동하지 않는 문제가 발생했습니다. 이로 인해 플레이어가 조작 불능 상태에 빠지는 심각한 버그였죠.
2.  **소통의 어려움:** 요구사항 해석에서 여러 번의 시행착오를 겪었습니다. 특히 "가만히 있어"와 "플레이어 위치 유지", "출구 방향 제외"에 대한 해석에서 사용자분과 저 모두 혼란을 겪었습니다.

**시도:**
1.  **조이스틱 오작동:** `game.js` 파일 전체를 다시 읽어 코드 라인별로 꼼꼼히 검토하던 중 `Math.atane` 오타를 발견했습니다. 이런 사소한 실수가 전체 시스템을 마비시킬 수 있다는 것을 다시 한번 깨달았습니다.
2.  **소통의 어려움:** 반복적인 피드백을 통해 내 해석이 잘못되었음을 깨닫고, 사용자분의 의도를 정확히 파악하기 위해 더 많은 질문과 확인을 시도했습니다. 이 과정에서 사용자분의 인내심에 감사함을 느꼈습니다.

**해결:**
1.  **조이스틱 오작동:** `Math.atane`를 `Math.atan2`로 수정하여 조이스틱 기능을 정상화했습니다. 이제 플레이어는 원활하게 캐릭터를 조작할 수 있습니다.
2.  **소통의 어려움:** 명확한 지시를 최우선으로 따르고, 제안이나 추가 설명을 자제하며 요청에 대한 직접적인 구현에 집중하는 방식으로 소통 방식을 개선했습니다. "플레이어 위치 유지"는 맵 중심을 플레이어 위치로 이동시키는 것으로, "출구 방향 제외"는 플레이어가 나간 출구 방향 자체를 다음 출구 후보에서 제외하는 것으로 최종 합의했습니다. 이 과정에서 사용자분의 피드백이 정말 큰 도움이 되었다.

---

## 💡 새롭게 배운 점

*   **요구사항 파악의 중요성:** 기능 구현의 핵심을 짚는 것이 개발 과정에서 가장 중요하며, 모호한 지시는 추가 질문을 통해 명확히 해야 함을 다시 한번 깨달았습니다. 이는 단순히 코드를 잘 짜는 것 이상으로 중요한 역량입니다.
*   **디버깅의 기본:** 예상치 못한 오류 발생 시, 최근 변경 사항을 중심으로 코드 전체를 다시 검토하는 것이 문제 해결에 효과적입니다. 특히 사소한 오타 하나가 큰 문제를 일으킬 수 있다는 점을 명심해야겠습니다.
*   **게임 상태 관리:** `rotationSpeeds`와 같은 배열을 사용하여 단계별 속도나 기타 속성을 관리하는 것이 코드의 가독성과 확장성을 높이는 데 유리합니다. 이는 향후 난이도 조절이나 새로운 기능 추가 시 유연성을 제공할 것입니다.

---

## 🚀 다음 계획

*   스테이지 건너뛰기 버그 수정 (현재는 사용자 요청으로 보류 중)
*   게임 난이도 조절을 위한 추가 요소 (예: 장애물 개수 증가, 플레이어 속도 변화 등)
*   게임 오버/승리 화면 구현
*   사운드 효과 및 배경 음악 추가
