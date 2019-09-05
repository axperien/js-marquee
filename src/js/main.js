document.addEventListener('DOMContentLoaded', () => {
    class Marque {
        constructor(space = 0, speed = 20) {
            this.speed = speed;
            this.space = space;

            this.interval = undefined;
            this.timeout = undefined;

            this.marqueeClassName = 'marquee';

            this.itemClassName = `.${this.marqueeClassName}__item`;
            this.itemClassNameGroup = `.${this.marqueeClassName}__group`;

            this.container = document.querySelector(`.${this.marqueeClassName}`);
            this.wrapper = document.querySelector(`.${this.marqueeClassName}__wrapper`);

            this.items = [].slice.call(document.querySelectorAll(this.itemClassName));

            var groupElements = document.createElement('div');
            groupElements.classList.add(this.itemClassNameGroup.substr(1));

            this.items.forEach(item => {
                groupElements.appendChild(item);
                this.itemWidth += item.offsetWidth
            });

            this.wrapper.appendChild(groupElements);

            this.duplicate();

            this.itemsLength = this.items.length;
            this.itemWidth = 0;

            this.items.forEach(item => {
                this.itemWidth += item.offsetWidth
            });

            this.widthWrapper = this.itemWidth + ((this.space / 2) * (this.itemsLength + 1));

            this.wrapper.style.width = parseInt(this.widthWrapper) + 'px';

            this.offsetLeft = 0;
            this.maxCloneLength = 2;

            this.init();
        }

        setSpaceBetween() {
            [].slice.call(document.querySelectorAll(this.itemClassName)).forEach(item => {
                if (this.space !== 0) {
                    item.style.marginLeft = this.space + 'px';
                    item.style.marginRight = this.space + 'px';
                }
            });
        }

        duplicate() {
            this.wrapper.appendChild(document.querySelector(this.itemClassNameGroup).cloneNode(true));
        }

        start() {
            this.move();
        }

        stop() {
            clearInterval(this.interval);
        }

        move(reverse) {
            clearTimeout(this.timeout);
            this.interval = setInterval(() => {
                if (Math.abs(this.offsetLeft) % parseInt(this.widthWrapper) === 0) this.replaceItems();
                if (Math.abs(this.offsetLeft) <= this.widthWrapper * this.maxCloneLength - this.space * 2) {
                    this.wrapper.style.left = this.offsetLeft + 'px';
                    if (!reverse) {
                        this.offsetLeft -= 1
                    } else {
                        if (this.offsetLeft) this.offsetLeft += 1
                    }
                } else {
                    clearInterval(this.interval);
                    this.offsetLeft = 0;
                    this.wrapper.style.left = this.offsetLeft + 'px';

                    var groupItems = [].slice.call(document.querySelectorAll(this.itemClassNameGroup));
                    groupItems.forEach((item, index) => {
                        if (index < groupItems.length - this.maxCloneLength) item.remove();
                    });

                    this.move();
                }
            }, this.speed);                        
        }

        moveNext() {
            this.stop();
            var oldSpeed = this.speed;
            this.speed = 5;
            this.move();
            this.speed = oldSpeed;
            this.timeout = setTimeout(() => {
                this.stop();
                this.move();                
            }, 2000);
        }

        movePrev() {
            this.stop();
            var oldSpeed = this.speed;
            this.speed = 5;
            this.move(true);
            this.speed = oldSpeed;
            this.timeout = setTimeout(() => {
                this.stop();
                this.move();                
            }, 2000);
        }

        replaceItems() {
            this.wrapper.appendChild(document.querySelector(this.itemClassNameGroup).cloneNode(true));
        }

        init() {
            this.setSpaceBetween();
            this.start();

            const nextButton = document.querySelector(`.${this.marqueeClassName}__arrow--next`);
            const prevButton = document.querySelector(`.${this.marqueeClassName}__arrow--prev`);

            if (nextButton !== null) nextButton.addEventListener('click', () => {
                this.moveNext();
            });
            if (prevButton !== null) prevButton.addEventListener('click', () => {
                this.movePrev();
            });
        }
    }

    const marque = new Marque(15);
});